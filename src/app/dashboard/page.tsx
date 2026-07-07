import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { averageScore, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function sessionAverage(turns: { scoresJson: unknown }[]) {
  const scores = turns
    .map((t) => averageScore(t.scoresJson as Record<string, number> | null))
    .filter((s): s is number => s !== null);

  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const sessions = await prisma.interviewSession.findMany({
    where: { userId: session.user.id },
    include: {
      turns: { select: { scoresJson: true, question: { select: { topic: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const allTurns = sessions.flatMap((s) => s.turns);
  const evaluatedTurns = allTurns.filter((t) => t.scoresJson);
  const overallAverage =
    evaluatedTurns.length > 0
      ? evaluatedTurns
          .map((t) => averageScore(t.scoresJson as Record<string, number>))
          .filter((s): s is number => s !== null)
          .reduce((a, b, _, arr) => a + b / arr.length, 0)
      : null;

  const topicMap = new Map<string, number[]>();
  for (const turn of evaluatedTurns) {
    const topic = turn.question.topic;
    const score = averageScore(turn.scoresJson as Record<string, number>);
    if (score === null) continue;
    const existing = topicMap.get(topic) ?? [];
    existing.push(score);
    topicMap.set(topic, existing);
  }

  const topicAverages = Array.from(topicMap.entries())
    .map(([topic, scores]) => ({
      topic,
      average: scores.reduce((a, b) => a + b, 0) / scores.length,
      count: scores.length,
    }))
    .sort((a, b) => b.average - a.average);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {session.user.name || session.user.email}</p>
        </div>
        <Link href="/sessions/new">
          <Button>New session</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total sessions</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{sessions.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Answers evaluated</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{evaluatedTurns.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average score</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {overallAverage !== null ? overallAverage.toFixed(1) : "-"}
            <span className="text-base font-normal text-muted-foreground"> / 5</span>
          </CardContent>
        </Card>
      </div>

      {topicAverages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Score by topic</CardTitle>
            <CardDescription>Your strongest and weakest areas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topicAverages.map((item) => (
              <div key={item.topic} className="flex items-center justify-between text-sm">
                <span className="capitalize">{item.topic}</span>
                <span>
                  {item.average.toFixed(1)} / 5 <span className="text-muted-foreground">({item.count})</span>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent sessions</CardTitle>
          <CardDescription>Click a session to continue or review feedback</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions yet. Start your first practice run.</p>
          ) : (
            sessions.map((s) => {
              const avg = sessionAverage(s.turns);
              return (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className="flex items-center justify-between rounded-md border p-4 transition hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{s.role}</p>
                    <p className="text-sm text-muted-foreground">
                      {s.level} - {s.topics.join(", ")} - {formatDate(s.createdAt)}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {avg !== null ? `${avg.toFixed(1)} / 5` : "Not evaluated"}
                  </div>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

