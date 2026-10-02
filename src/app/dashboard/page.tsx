import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { averageScore, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MessageSquare, TrendingUp, Award, Target, BookOpen, Code2, ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { JAVA_PROBLEMS } from "@/lib/java/problems";
import { dbRowToProgressRow, rowsToProgress } from "@/lib/java/persist";
import { computeLabLevel, solvedCount, totalXp, type LabProgress } from "@/lib/java/progress";

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

  // A missing or unreachable table degrades to an empty card rather than
  // taking down the whole dashboard.
  let javaProgress: LabProgress = {};
  try {
    const javaRows = await prisma.javaLabProgress.findMany({
      where: { userId: session.user.id },
      orderBy: { problemId: "asc" },
    });
    javaProgress = rowsToProgress(javaRows.map(dbRowToProgressRow));
  } catch (error) {
    console.error("dashboard: could not load java lab progress", error);
  }
  const javaXp = totalXp(javaProgress);
  const javaLevel = computeLabLevel(javaXp);
  const javaSolved = solvedCount(javaProgress);
  const javaAttempts = Object.values(javaProgress).reduce(
    (sum, record) => sum + record.attempts,
    0
  );
  const javaPct =
    JAVA_PROBLEMS.length > 0
      ? Math.min(100, Math.round((javaSolved / JAVA_PROBLEMS.length) * 100))
      : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Welcome back, <span className="font-semibold text-foreground">{session.user.name || session.user.email}</span>
          </p>
        </div>
        <Link href="/sessions/new">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
            <Target className="w-4 h-4 mr-2" />
            New session
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif">{sessions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Interview practice sessions</p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Answers Evaluated</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif">{evaluatedTurns.length}</div>
            <p className="text-xs text-muted-foreground mt-1">AI-powered feedback</p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif">
              {overallAverage !== null ? overallAverage.toFixed(1) : "-"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Out of 5 points</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            <CardTitle className="font-serif">Java CP Lab</CardTitle>
          </div>
          <CardDescription>
            {JAVA_PROBLEMS.length} problems - write, compile and run locally with your
            own JDK
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 font-serif text-base font-bold text-white shadow-lg">
                {javaLevel.level}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Level {javaLevel.level}</span>
                  <Badge variant="purple">{javaLevel.title}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {javaXp} XP · {javaAttempts} {javaAttempts === 1 ? "run" : "runs"}
                </p>
              </div>
            </div>
            <Link href="/java">
              <Button variant="outline" className="gap-2">
                Open lab <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Problems solved
              </span>
              <span className="font-mono">
                {javaSolved}/{JAVA_PROBLEMS.length} · {javaPct}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${javaPct}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {topicAverages.length > 0 && (
        <Card className="border-2 hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle className="font-serif">Score by Topic</CardTitle>
            </div>
            <CardDescription>Your strongest and weakest areas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topicAverages.map((item, index) => (
              <div key={item.topic} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize font-medium flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    {item.topic}
                  </span>
                  <span className="font-mono font-semibold">
                    {item.average.toFixed(1)} / 5
                    <span className="text-muted-foreground ml-1">({item.count})</span>
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${(item.average / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-2 hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <CardTitle className="font-serif">Recent Sessions</CardTitle>
          </div>
          <CardDescription>Click a session to continue or review feedback</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No sessions yet. Start your first practice run.</p>
            </div>
          ) : (
            sessions.map((s) => {
              const avg = sessionAverage(s.turns);
              return (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className="group flex items-center justify-between rounded-lg border-2 p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-md hover:-translate-x-1"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-lg group-hover:text-primary transition-colors">{s.role}</p>
                    <p className="text-sm text-muted-foreground">
                      {s.level} • {s.topics.join(", ")} • {formatDate(s.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {avg !== null ? (
                      <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 px-3 py-1 rounded-full">
                        <Award className="w-4 h-4 text-primary" />
                        <span className="font-mono font-semibold text-sm">{avg.toFixed(1)} / 5</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Not evaluated</span>
                    )}
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

