import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SessionInterview } from "@/components/sessions/session-interview";
import { Button } from "@/components/ui/button";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { id } = await params;

  const interviewSession = await prisma.interviewSession.findFirst({
    where: { id, userId: session.user.id },
    include: {
      turns: {
        include: { question: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!interviewSession) notFound();

  const questions = await prisma.question.findMany({
    where: {
      topic: { in: interviewSession.topics },
      difficulty: interviewSession.level,
    },
    orderBy: { createdAt: "asc" },
    take: 5,
  });

  const fallbackQuestions =
    questions.length > 0
      ? questions
      : await prisma.question.findMany({
          where: { topic: { in: interviewSession.topics } },
          take: 5,
        });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{interviewSession.role}</h1>
          <p className="text-muted-foreground">
            {interviewSession.level} · {interviewSession.topics.join(", ")}
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Back to dashboard</Button>
        </Link>
      </div>

      <SessionInterview
        sessionId={interviewSession.id}
        questions={fallbackQuestions}
        turns={interviewSession.turns.map((t) => ({
          id: t.id,
          questionId: t.questionId,
          userAnswer: t.userAnswer,
          aiFeedbackJson: t.aiFeedbackJson,
          scoresJson: t.scoresJson as Record<string, number> | null,
          question: {
            prompt: t.question.prompt,
            topic: t.question.topic,
            type: t.question.type,
          },
        }))}
      />
    </div>
  );
}
