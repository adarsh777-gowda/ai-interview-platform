import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { submitTurnSchema } from "@/lib/ai/schemas";
import { evaluateAnswer, EvaluationError } from "@/lib/ai/openai";
import { checkRateLimit, logAiRequest } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sessionId } = await params;
  const body = await request.json();
  const parsed = submitTurnSchema.safeParse(body);

  if (!parsed.success) {
    const message =
      parsed.error.issues.map((issue) => issue.message).join(", ") || "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const interviewSession = await prisma.interviewSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
  });

  if (!interviewSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const question = await prisma.question.findUnique({
    where: { id: parsed.data.questionId },
  });

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const maxRequests = Number(process.env.AI_RATE_LIMIT_MAX || 10);
  const windowMs = Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 60000);
  const rateKey = `ai:${session.user.id}`;

  const rate = await checkRateLimit(rateKey, maxRequests, windowMs);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", resetAt: rate.resetAt },
      { status: 429 }
    );
  }

  try {
    const evaluation = await evaluateAnswer({
      role: interviewSession.role,
      level: interviewSession.level,
      topic: question.topic,
      questionType: question.type,
      question: question.prompt,
      userAnswer: parsed.data.userAnswer,
    });

    const turn = await prisma.interviewTurn.create({
      data: {
        sessionId,
        questionId: question.id,
        userAnswer: parsed.data.userAnswer,
        aiFeedbackJson: evaluation.feedback,
        scoresJson: evaluation.feedback.scores,
        modelUsed: evaluation.modelUsed,
        promptVersion: evaluation.promptVersion,
        tokenUsage: evaluation.tokenUsage,
        latencyMs: evaluation.latencyMs,
      },
      include: { question: true },
    });

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: { status: "IN_PROGRESS" },
    });

    logAiRequest({
      userId: session.user.id,
      sessionId,
      turnId: turn.id,
      model: evaluation.modelUsed,
      tokens: evaluation.tokenUsage.total,
      latencyMs: evaluation.latencyMs,
    });

    return NextResponse.json(turn, { status: 201 });
  } catch (error) {
    const status = error instanceof EvaluationError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Evaluation failed";
    return NextResponse.json({ error: message }, { status });
  }
}
