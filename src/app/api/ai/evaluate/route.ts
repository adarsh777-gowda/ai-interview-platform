import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { submitTurnSchema } from "@/lib/ai/schemas";
import { evaluateAnswer } from "@/lib/ai/openai";
import { checkRateLimit, logAiRequest } from "@/lib/rate-limit";

const evaluateRequestSchema = submitTurnSchema.extend({
  sessionId: z.string().min(1).max(100),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = evaluateRequestSchema.safeParse(body);

  if (!parsed.success) {
    const message =
      parsed.error.issues.map((issue) => issue.message).join(", ") || "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const interviewSession = await prisma.interviewSession.findFirst({
    where: { id: parsed.data.sessionId, userId: session.user.id },
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
  const rate = await checkRateLimit(`ai:${session.user.id}`, maxRequests, windowMs);

  if (!rate.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
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

    logAiRequest({
      userId: session.user.id,
      sessionId: parsed.data.sessionId,
      model: evaluation.modelUsed,
      tokens: evaluation.tokenUsage.total,
      latencyMs: evaluation.latencyMs,
    });

    return NextResponse.json(evaluation);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Evaluation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
