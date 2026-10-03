import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { averageScore, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeftRight,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  Code2,
  Flame,
  Gauge,
  History,
  MessageSquare,
  Play,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { JAVA_PROBLEMS } from "@/lib/java/problems";
import { JAVA_CATEGORY_LABELS } from "@/lib/java/types";
import { dbRowToProgressRow, rowsToProgress } from "@/lib/java/persist";
import {
  computeLabLevel,
  earnedLabBadgeIds,
  LAB_BADGES,
  solvedCount,
  totalXp,
  type LabProgress,
} from "@/lib/java/progress";
import {
  BADGES,
  buildSessionStats,
  computeLevel,
  computeStreak,
  earnedBadgeIds,
  GOOD_TURN_THRESHOLD,
  xpFromTurns,
  type StatsTurn,
} from "@/lib/gamification";

type DashboardTurn = {
  scoresJson: unknown;
  userAnswer: string | null;
  question: { topic: string };
};

const TOPIC_THEMES = [
  { text: "text-blue-600", bar: "from-blue-500 to-blue-600", dot: "bg-blue-500" },
  { text: "text-purple-600", bar: "from-purple-500 to-purple-600", dot: "bg-purple-500" },
  { text: "text-pink-600", bar: "from-pink-500 to-pink-600", dot: "bg-pink-500" },
  { text: "text-emerald-600", bar: "from-emerald-500 to-emerald-600", dot: "bg-emerald-500" },
  { text: "text-amber-600", bar: "from-amber-500 to-amber-600", dot: "bg-amber-500" },
] as const;

function themeFor(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 997;
  }
  return TOPIC_THEMES[hash % TOPIC_THEMES.length] ?? TOPIC_THEMES[0];
}

function scoreTone(value: number | null) {
  if (value === null) return "text-muted-foreground";
  if (value >= 4.5) return "text-emerald-600";
  if (value >= GOOD_TURN_THRESHOLD) return "text-blue-600";
  if (value >= 2.5) return "text-amber-600";
  return "text-rose-600";
}

function sessionAverage(turns: DashboardTurn[]) {
  const scores = turns
    .map((t) => averageScore(t.scoresJson as Record<string, number> | null))
    .filter((s): s is number => s !== null);
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function SectionHeading({
  icon: Icon,
  kicker,
  title,
  blurb,
  action,
}: {
  icon: LucideIcon;
  kicker: string;
  title: string;
  blurb?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-md">
          <Icon className="h-4 w-4" />
        </span>
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            {kicker}
          </p>
          <h2 className="font-serif text-2xl font-bold tracking-tight">{title}</h2>
          {blurb ? (
            <p className="max-w-md text-sm text-muted-foreground">{blurb}</p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}

function MomentumChart({
  series,
}: {
  series: { label: string; avg: number | null }[];
}) {
  const width = 560;
  const height = 200;
  const padX = 30;
  const padTop = 20;
  const padBottom = 30;
  const baseline = height - padBottom;
  const spanX = Math.max(series.length - 1, 1);
  const x = (i: number) => padX + (i / spanX) * (width - padX * 2);
  const y = (v: number) => padTop + (1 - v / 5) * (height - padTop - padBottom);

  let pen = false;
  let line = "";
  const dots: { cx: number; cy: number; avg: number }[] = [];
  series.forEach((point, i) => {
    if (point.avg === null) {
      pen = false;
      return;
    }
    line += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(point.avg).toFixed(1)} `;
    pen = true;
    dots.push({ cx: x(i), cy: y(point.avg), avg: point.avg });
  });
  const connected = series.every((point) => point.avg !== null) && dots.length > 1;
  const area = connected
    ? `${line}L${x(series.length - 1).toFixed(1)},${baseline} L${x(0).toFixed(1)},${baseline} Z`
    : "";
  const current = dots[dots.length - 1];
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="Interview score momentum"
    >
      <defs>
        <linearGradient id="momentumLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="55%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="momentumFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
        </linearGradient>
      </defs>
      {[1, 2, 3, 4, 5].map((tick) => (
        <g key={tick}>
          <line
            x1={padX}
            x2={width - padX}
            y1={y(tick)}
            y2={y(tick)}
            strokeWidth={1}
            strokeDasharray="3 4"
            className="stroke-border"
          />
          <text
            x={padX - 9}
            y={y(tick) + 3.5}
            textAnchor="end"
            fontSize={10}
            className="fill-muted-foreground font-mono"
          >
            {tick}
          </text>
        </g>
      ))}
      {area !== "" && <path d={area} fill="url(#momentumFill)" />}
      {line !== "" && (
        <path
          d={line}
          fill="none"
          stroke="url(#momentumLine)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {dots.map((dot, i) => (
        <circle
          key={i}
          cx={dot.cx}
          cy={dot.cy}
          r={i === dots.length - 1 ? 5 : 3.5}
          fill={i === dots.length - 1 ? "#ec4899" : "hsl(var(--card))"}
          strokeWidth={2.5}
          stroke={i === dots.length - 1 ? "#ec4899" : "#8b5cf6"}
        />
      ))}
      {current && (
        <text
          x={current.cx}
          y={current.cy - 13}
          textAnchor="middle"
          fontSize={13}
          fontWeight={700}
          fill="#8b5cf6"
        >
          {current.avg.toFixed(1)}
        </text>
      )}
    </svg>
  );
}

function Donut({ solved, total }: { solved: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((solved / total) * 100);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const filled = (pct / 100) * circumference;
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
        <defs>
          <linearGradient id="labDonut" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="55%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <circle
          cx={60}
          cy={60}
          r={radius}
          fill="none"
          strokeWidth={13}
          className="stroke-muted"
        />
        <circle
          cx={60}
          cy={60}
          r={radius}
          fill="none"
          stroke="url(#labDonut)"
          strokeWidth={13}
          strokeLinecap="round"
          strokeDasharray={`${filled.toFixed(1)} ${circumference.toFixed(1)}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="font-serif text-2xl font-bold tabular-nums">{pct}%</p>
          <p className="text-[11px] font-medium text-muted-foreground">solved</p>
        </div>
      </div>
    </div>
  );
}

function Ring({ value, tone }: { value: number; tone: string }) {
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <svg viewBox="0 0 36 36" className="h-9 w-9 shrink-0 -rotate-90">
      <circle
        cx={18}
        cy={18}
        r={radius}
        fill="none"
        strokeWidth={4.5}
        className="stroke-muted"
      />
      <circle
        cx={18}
        cy={18}
        r={radius}
        fill="none"
        strokeWidth={4.5}
        strokeLinecap="round"
        className={tone}
        strokeDasharray={`${((clamped / 100) * circumference).toFixed(1)} ${circumference.toFixed(1)}`}
      />
    </svg>
  );
}

function Spark({ points }: { points: number[] }) {
  const width = 128;
  const height = 40;
  const span = Math.max(points.length - 1, 1);
  const coords = points.map((value, i) => {
    const px = 6 + (i / span) * (width - 12);
    const py = 5 + (1 - value / 5) * (height - 10);
    return `${px.toFixed(1)},${py.toFixed(1)}`;
  });
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-10 w-32 shrink-0 text-purple-500"
      role="img"
      aria-label="Recent score trend"
    >
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map((point, i) => {
        const [cx = "0", cy = "0"] = point.split(",");
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={i === coords.length - 1 ? 3.5 : 2}
            fill="currentColor"
            opacity={i === coords.length - 1 ? 1 : 0.45}
          />
        );
      })}
    </svg>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const displayName = session.user.name || session.user.email || "there";

  const sessions = await prisma.interviewSession.findMany({
    where: { userId: session.user.id },
    include: {
      turns: {
        orderBy: { createdAt: "asc" },
        select: {
          scoresJson: true,
          userAnswer: true,
          question: { select: { topic: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const allTurns: DashboardTurn[] = sessions.flatMap((item) => item.turns);
  const answeredCount = allTurns.filter((turn) =>
    (turn.userAnswer ?? "").trim()
  ).length;
  const evaluatedTurns = allTurns.filter((turn) => turn.scoresJson);
  const validScores = evaluatedTurns.flatMap((turn) => {
    const value = averageScore(turn.scoresJson as Record<string, number> | null);
    return value === null ? [] : [value];
  });
  const overallAverage =
    validScores.length > 0
      ? validScores.reduce((a, b) => a + b, 0) / validScores.length
      : null;

  const turnStats: StatsTurn[] = evaluatedTurns.map((turn) => ({
    scoresJson: (turn.scoresJson ?? null) as Record<string, number> | null,
    userAnswer: turn.userAnswer ?? "",
    topic: turn.question.topic,
  }));
  const interviewXp = xpFromTurns(
    allTurns.map((turn) => ({
      scoresJson: (turn.scoresJson ?? null) as Record<string, number> | null,
      userAnswer: turn.userAnswer ?? "",
    }))
  );
  const interviewLevel = computeLevel(interviewXp);
  const sessionAverages = sessions.map((item) => sessionAverage(item.turns));
  const streak = computeStreak([...sessionAverages].reverse());
  const momentumSeries = sessions
    .slice(0, 8)
    .map((item) => ({ label: formatDate(item.createdAt), avg: sessionAverage(item.turns) }))
    .reverse();
  const momentumScores = momentumSeries.flatMap((point) =>
    point.avg === null ? [] : [point.avg]
  );
  const firstMomentum = momentumScores[0];
  const lastMomentum = momentumScores[momentumScores.length - 1];
  const momentumDelta =
    firstMomentum !== undefined &&
    lastMomentum !== undefined &&
    momentumScores.length >= 2
      ? lastMomentum - firstMomentum
      : null;
  const trendPoints =
    momentumScores.length >= 2
      ? momentumScores.slice(-6)
      : overallAverage !== null
        ? [overallAverage]
        : [];

  const topicMap = new Map<string, number[]>();
  for (const turn of evaluatedTurns) {
    const score = averageScore(turn.scoresJson as Record<string, number> | null);
    if (score === null) continue;
    const existing = topicMap.get(turn.question.topic) ?? [];
    existing.push(score);
    topicMap.set(turn.question.topic, existing);
  }
  const topicAverages = Array.from(topicMap.entries())
    .map(([topic, scores]) => ({
      topic,
      average: scores.reduce((a, b) => a + b, 0) / scores.length,
      count: scores.length,
    }))
    .sort((a, b) => b.average - a.average);
  const bestTopic = topicAverages[0] ?? null;
  const focusCandidate = [...topicAverages].sort(
    (a, b) => a.average - b.average || b.count - a.count || a.topic.localeCompare(b.topic)
  )[0];
  const focusTopic =
    focusCandidate && focusCandidate.average < GOOD_TURN_THRESHOLD
      ? focusCandidate
      : null;

  const earnedIds = new Set(earnedBadgeIds(buildSessionStats(turnStats, answeredCount)));
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
  const labBadgeInputs = JAVA_PROBLEMS.map((problem) => ({
    id: problem.id,
    difficulty: problem.difficulty,
    category: problem.category,
  }));
  const earnedLabIds = new Set(earnedLabBadgeIds(javaProgress, labBadgeInputs));
  const solvedIds = new Set(
    Object.entries(javaProgress)
      .filter(([, record]) => record.solved)
      .map(([problemId]) => problemId)
  );
  const unsolvedNext = JAVA_PROBLEMS.filter(
    (problem) => !solvedIds.has(problem.id)
  ).slice(0, 3);
  const categoryRollup = new Map<string, { solved: number; total: number }>();
  for (const problem of JAVA_PROBLEMS) {
    const entry = categoryRollup.get(problem.category) ?? { solved: 0, total: 0 };
    entry.total += 1;
    if (solvedIds.has(problem.id)) entry.solved += 1;
    categoryRollup.set(problem.category, entry);
  }
  const weakestJavaCategory = [...categoryRollup.entries()]
    .map(([category, rollup]) => ({
      category,
      label: JAVA_CATEGORY_LABELS[category as keyof typeof JAVA_CATEGORY_LABELS],
      solved: rollup.solved,
      total: rollup.total,
      pct: rollup.total === 0 ? 0 : Math.round((rollup.solved / rollup.total) * 100),
    }))
    .sort((a, b) => a.pct - b.pct || b.total - a.total)[0];

  const heroStats = [
    { label: "Interview XP", value: interviewXp.toLocaleString() },
    { label: "Lab XP", value: javaXp.toLocaleString() },
    { label: "Answers", value: String(answeredCount) },
  ];
  const kpis = [
    {
      title: "Interview level",
      value: `Lv ${interviewLevel.level}`,
      sub: `${interviewLevel.title} - ${interviewLevel.intoLevel}/${interviewLevel.forNextLevel} XP`,
      pct: interviewLevel.progressPct,
      icon: Zap,
      chip: "from-blue-500 to-blue-600",
      entrance: "rise-1",
    },
    {
      title: "Average score",
      value: overallAverage !== null ? overallAverage.toFixed(1) : "-",
      sub:
        momentumDelta !== null
          ? `${momentumDelta >= 0 ? "+" : ""}${momentumDelta.toFixed(1)} across recent sessions`
          : `${evaluatedTurns.length} scored answers`,
      pct: overallAverage !== null ? (overallAverage / 5) * 100 : 0,
      icon: Gauge,
      chip: "from-purple-500 to-purple-600",
      entrance: "rise-2",
    },
    {
      title: "Scoring streak",
      value: streak > 0 ? `${streak}x` : "0",
      sub: streak >= 3 ? "On fire - protect the streak" : "3+ strong sessions starts a streak",
      pct: Math.min(100, (streak / 5) * 100),
      icon: Flame,
      chip: "from-pink-500 to-pink-600",
      entrance: "rise-3",
    },
  ] as const;

  const visibleBadges = BADGES.map((badge) => ({
    ...badge,
    earned: earnedIds.has(badge.id),
  }));
  const earnedCount = visibleBadges.filter((badge) => badge.earned).length;

  return (
    <div className="space-y-10 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/60 px-6 py-9 sm:px-9">
        <div className="grid-surface pointer-events-none absolute inset-0" />
        <div className="aurora pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl" />
        <div
          className="aurora pointer-events-none absolute -right-20 -top-16 h-72 w-72 rounded-full bg-purple-500/25 blur-3xl"
          style={{ animationDelay: "3s" }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-[16rem] max-w-xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="purple" className="gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> Command center
              </Badge>
              {streak >= 3 && (
                <Badge variant="warning" className="gap-1.5">
                  <Flame className="h-3.5 w-3.5" /> {streak}-session streak
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">
                Welcome back, <span className="text-gradient">{displayName}</span>
              </h1>
              <p className="max-w-lg text-muted-foreground">
                {interviewLevel.title} energy, lab momentum, and the next rep to take.
                This board reads both engines at a glance.
              </p>
            </div>
            <dl className="flex flex-wrap gap-2.5">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-border/60 bg-background/70 px-4 py-2.5 backdrop-blur"
                >
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {stat.label}
                  </dt>
                  <dd className="font-serif text-xl font-bold tabular-nums">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex w-full max-w-xs flex-col gap-3">
            <Button
              asChild
              size="lg"
              className="btn-gradient shine h-14 gap-2 px-6 text-base shadow-xl shadow-purple-500/25"
            >
              <Link href="/sessions/new">
                <Play className="h-4 w-4" /> Start a session
              </Link>
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="h-11 border-2">
                <Link href="/java">
                  <Code2 className="h-4 w-4" /> Java Lab
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 border-2">
                <Link href="/sessions/new">
                  <Target className="h-4 w-4" /> New drill
                </Link>
              </Button>
            </div>
            {bestTopic ? (
              <p className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                Strongest lane:{" "}
                <span className="font-bold capitalize">{bestTopic.topic}</span> at{" "}
                {bestTopic.average.toFixed(1)}/5 across {bestTopic.count} answers.
              </p>
            ) : (
              <p className="rounded-2xl border border-border/60 bg-background/70 px-4 py-2.5 text-xs text-muted-foreground backdrop-blur">
                Complete one scored session to unlock momentum, streaks, and badges.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {kpis.map((kpi) => (
          <Card
            key={kpi.title}
            className={`card-hover group relative overflow-hidden border bg-card/70 backdrop-blur ${kpi.entrance}`}
          >
            <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${kpi.chip}`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <span
                className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${kpi.chip} text-white shadow-md transition-transform duration-300 group-hover:scale-110`}
              >
                <kpi.icon className="h-5 w-5" />
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <p className="font-serif text-4xl font-bold tabular-nums">{kpi.value}</p>
                {kpi.title === "Average score" && trendPoints.length > 0 ? (
                  <Spark points={trendPoints} />
                ) : (
                  <Ring value={kpi.pct} tone="stroke-purple-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{kpi.sub}</p>
              <div className="h-2 overflow-hidden rounded-full bg-muted/70 ring-1 ring-inset ring-border">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${kpi.chip} transition-all duration-700`}
                  style={{ width: `${Math.max(4, Math.min(100, kpi.pct))}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-5">
        <Card className="relative overflow-hidden border bg-card/70 backdrop-blur rise-2 lg:col-span-3">
          <div className="grid-surface pointer-events-none absolute inset-0 opacity-50" />
          <CardHeader className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 font-serif text-xl">
                  <BarChart3 className="h-5 w-5 text-primary" /> Momentum
                </CardTitle>
                <CardDescription>
                  Last {momentumSeries.length} sessions, oldest to newest
                </CardDescription>
              </div>
              {momentumDelta !== null ? (
                <Badge variant={momentumDelta >= 0 ? "success" : "warning"} className="gap-1.5">
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  {momentumDelta >= 0 ? "+" : ""}
                  {momentumDelta.toFixed(1)} pts
                </Badge>
              ) : (
                <Badge variant="outline">Not enough data</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="relative">
            {momentumScores.length >= 2 ? (
              <MomentumChart series={momentumSeries} />
            ) : (
              <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-border/70 bg-background/60 px-6 py-14 text-center">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-medium">Finish two scored sessions</p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Your momentum line appears here once there is a second data point to
                  compare against.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-blue-500/25 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur rise-3 lg:col-span-2">
          <CardHeader className="relative">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <Badge variant="info" className="gap-1.5">
                  <Code2 className="h-3.5 w-3.5" /> Featured
                </Badge>
                <CardTitle className="text-gradient font-serif text-2xl">
                  Java CP Lab
                </CardTitle>
                <CardDescription>
                  Level {javaLevel.level} {javaLevel.title} - {javaXp.toLocaleString()} XP
                  banked across {javaAttempts} runs.
                </CardDescription>
              </div>
              <Donut solved={javaSolved} total={JAVA_PROBLEMS.length} />
            </div>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>
                  Level {javaLevel.level} - {javaLevel.intoLevel}/{javaLevel.forNextLevel} XP
                </span>
                <span className="tabular-nums">{javaLevel.progressPct}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted/70 ring-1 ring-inset ring-border">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-[0_0_12px_rgba(139,92,246,0.65)] transition-all duration-700"
                  style={{ width: `${javaLevel.progressPct}%` }}
                />
              </div>
            </div>
            {weakestJavaCategory && (
              <p className="rounded-2xl border border-border/60 bg-background/70 px-4 py-2.5 text-xs text-muted-foreground backdrop-blur">
                Next frontier:{" "}
                <span className="font-semibold text-foreground">
                  {weakestJavaCategory.label}
                </span>{" "}
                at {weakestJavaCategory.solved}/{weakestJavaCategory.total} solved.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button asChild className="btn-gradient shine h-10 px-4">
                <Link href="/java">
                  Open lab <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-10 border-2 px-4">
                <Link href="/java">
                  <CheckCircle2 className="h-4 w-4" /> {javaSolved}/{JAVA_PROBLEMS.length} solved
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-5 lg:grid-cols-3">
        <Card className="relative overflow-hidden border bg-card/70 backdrop-blur rise-4 lg:col-span-2">
          <CardHeader className="relative">
            <SectionHeading
              icon={BookOpen}
              kicker="Coverage map"
              title="Topic performance"
              blurb={`${topicAverages.length} topic${
                topicAverages.length === 1 ? "" : "s"
              } scored so far, ranked by average.`}
              action={
                <Badge variant="purple" className="gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {sessions.length > 0
                    ? `Last ${formatDate(sessions[0].createdAt)}`
                    : "No sessions"}
                </Badge>
              }
            />
          </CardHeader>
          <CardContent className="relative">
            {topicAverages.length === 0 ? (
              <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-border/70 bg-background/60 px-6 py-12 text-center">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-medium">No topic scores yet</p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Finish a scored session and every topic you touched will rank itself here.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {topicAverages.slice(0, 6).map((entry) => {
                  const theme = themeFor(entry.topic);
                  const pct = Math.max(4, Math.min(100, (entry.average / 5) * 100));
                  return (
                    <li key={entry.topic} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${theme.dot}`} />
                          <span className="truncate font-medium capitalize">
                            {entry.topic}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {entry.count} {entry.count === 1 ? "answer" : "answers"}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 font-mono text-sm font-bold tabular-nums ${theme.text}`}
                        >
                          {entry.average.toFixed(1)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted/70 ring-1 ring-inset ring-border">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${theme.bar} transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="relative overflow-hidden border-2 border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent backdrop-blur rise-5">
            <CardHeader className="relative">
              <SectionHeading
                icon={Trophy}
                kicker="Trophy case"
                title="Badges"
                blurb={`${earnedCount} of ${visibleBadges.length} interview badges unlocked.`}
              />
            </CardHeader>
            <CardContent className="relative grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
              {visibleBadges.map((badge) => (
                <div
                  key={badge.id}
                  className={`flex items-center gap-3 rounded-2xl border p-3 transition-all duration-300 ${
                    badge.earned
                      ? "card-hover border-amber-500/35 bg-amber-500/10"
                      : "border-border/60 bg-background/50 opacity-55"
                  }`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-background/80 text-xl shadow-sm">
                    {badge.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{badge.label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {badge.description}
                    </p>
                  </div>
                  {badge.earned ? (
                    <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-amber-500" />
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border bg-card/70 backdrop-blur rise-6">
            <CardHeader className="relative">
              <div className="space-y-2">
                <Badge variant={focusTopic ? "warning" : "success"} className="gap-1.5">
                  <Target className="h-3.5 w-3.5" /> Coach note
                </Badge>
                <CardTitle className="font-serif text-xl">
                  {focusTopic ? `Drill ${focusTopic.topic}` : "Every lane looks healthy"}
                </CardTitle>
                <CardDescription>
                  {focusTopic
                    ? `Averaging ${focusTopic.average.toFixed(1)}/5 across ${focusTopic.count} ${
                        focusTopic.count === 1 ? "answer" : "answers"
                      }. This is the fastest lever on your overall score.`
                    : "Nothing is dragging the average yet. Keep the cadence and widen topic coverage."}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="relative flex flex-wrap items-center gap-2.5">
              <Button asChild className="btn-gradient shine h-10 px-4">
                <Link href="/sessions/new">
                  <Zap className="h-4 w-4" /> Start a drill
                </Link>
              </Button>
              <Badge variant="outline" className="h-10 gap-1.5 px-3">
                <Code2 className="h-3.5 w-3.5" />
                {earnedLabIds.size}/{LAB_BADGES.length} lab badges
              </Badge>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          icon={History}
          kicker="Up next"
          title="Continue the climb"
          blurb="The closest unsolved lab problems, then your interview history."
        />
        {unsolvedNext.length > 0 && (
          <div className="grid gap-3 md:grid-cols-3">
            {unsolvedNext.map((problem, index) => (
              <Link
                key={problem.id}
                href="/java"
                className={`card-hover group rounded-2xl border bg-card/70 p-4 backdrop-blur ${
                  index === 0 ? "rise-2" : index === 1 ? "rise-3" : "rise-4"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={
                      problem.difficulty === "HARD"
                        ? "destructive"
                        : problem.difficulty === "MEDIUM"
                          ? "warning"
                          : "success"
                    }
                  >
                    {problem.difficulty}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
                <p className="mt-2.5 font-serif text-base font-bold leading-snug">
                  {problem.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {JAVA_CATEGORY_LABELS[problem.category]}
                </p>
              </Link>
            ))}
          </div>
        )}
        <Card className="border bg-card/70 backdrop-blur rise-4">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 font-serif text-xl">
                  <MessageSquare className="h-5 w-5 text-primary" /> Session history
                </CardTitle>
                <CardDescription>
                  Click a session to continue or review feedback
                </CardDescription>
              </div>
              <Button asChild variant="outline" className="h-10 border-2 px-4">
                <Link href="/sessions/new">
                  <Target className="h-4 w-4" /> New session
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.length === 0 ? (
              <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-border/70 bg-background/60 px-6 py-12 text-center">
                <Target className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-medium">No sessions yet</p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Start your first practice run and it will show up here with scores,
                  streaks, and badges.
                </p>
              </div>
            ) : (
              sessions.map((item) => {
                const avg = sessionAverage(item.turns);
                return (
                  <Link
                    key={item.id}
                    href={`/sessions/${item.id}`}
                    className="group flex items-center justify-between gap-4 rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-base font-semibold transition-colors group-hover:text-primary">
                        {item.role}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {item.level} - {item.topics.join(", ")} - {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {avg !== null ? (
                        <span className="flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1">
                          <Award className="h-4 w-4 text-primary" />
                          <span className={`font-mono text-sm font-bold tabular-nums ${scoreTone(avg)}`}>
                            {avg.toFixed(1)} / 5
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">
                          Not evaluated
                        </span>
                      )}
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
