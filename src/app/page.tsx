import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  Brain,
  Code2,
  Rocket,
  Sparkles,
  Target,
  Terminal,
  TrendingUp,
} from "lucide-react";

import { JAVA_PROBLEMS } from "@/lib/java/problems";

const HIGHLIGHTS = [
  {
    icon: Code2,
    value: `${JAVA_PROBLEMS.length} lab problems`,
    label: "Compiled by your own javac",
  },
  {
    icon: Brain,
    value: "Rubric scoring",
    label: "Clarity, structure, depth",
  },
  {
    icon: TrendingUp,
    value: "XP & badges",
    label: "Progress saved to your account",
  },
];

const FEATURES = [
  {
    icon: Target,
    title: "Structured Practice",
    description:
      "Behavioral, technical, coding, and system design questions tailored to your role and experience level.",
    tint: "from-blue-500 to-blue-600",
  },
  {
    icon: Brain,
    title: "AI-Powered Evaluation",
    description:
      "Get detailed scores on clarity, structure, correctness, and depth with actionable improvement suggestions.",
    tint: "from-purple-500 to-purple-600",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description:
      "Monitor your improvement over time with topic-level analytics and session history.",
    tint: "from-pink-500 to-pink-600",
  },
];

const STEPS = [
  {
    icon: Sparkles,
    title: "Sign in",
    description: "Enter the shared access password once and your workspace is ready.",
  },
  {
    icon: Target,
    title: "Configure a session",
    description: "Choose a role, level and the topics you want to be drilled on.",
  },
  {
    icon: Rocket,
    title: "Answer and level up",
    description: "Get scored instantly, bank XP and watch your weak spots shrink.",
  },
];

const ENTRANCES = ["rise-1", "rise-2", "rise-3"];

export default function HomePage() {
  return (
    <div className="space-y-16 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/50 px-6 py-14 sm:py-20">
        <div className="grid-surface pointer-events-none absolute inset-0" />
        <div className="aurora pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl" />
        <div
          className="aurora pointer-events-none absolute -right-24 -top-16 h-72 w-72 rounded-full bg-purple-500/25 blur-3xl"
          style={{ animationDelay: "2.5s" }}
        />
        <div className="pointer-events-none absolute -bottom-32 left-1/2 h-64 w-[34rem] -translate-x-1/2 rounded-full bg-pink-500/15 blur-3xl" />

        <div className="relative mx-auto max-w-3xl space-y-7 text-center">
          <Badge
            variant="info"
            className="mx-auto gap-1.5 border-0 bg-background/70 px-4 py-1.5 text-sm font-medium backdrop-blur"
          >
            <Sparkles className="h-4 w-4" />
            Free forever - compiled locally, no credits
          </Badge>

          <h1 className="text-gradient-animated font-serif text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Master Your Interview Skills
          </h1>

          <p className="mx-auto max-w-2xl text-xl font-light leading-relaxed text-muted-foreground">
            Practice with AI-powered feedback, detailed rubric scoring, and personalized
            progress tracking. Turn interview prep into a structured, data-driven journey.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="btn-gradient shine h-14 px-9 text-lg shadow-xl shadow-purple-500/25"
            >
              <Link href="/sign-in">
                Start Practicing
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 border-2 px-9 text-lg"
            >
              <Link href="/dashboard">View Dashboard</Link>
            </Button>
          </div>

          <dl className="grid gap-3 pt-2 sm:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <div
                key={item.value}
                className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 backdrop-blur"
              >
                <dt className="flex items-center justify-center gap-2 font-semibold">
                  <item.icon className="h-4 w-4 text-primary" />
                  {item.value}
                </dt>
                <dd className="mt-0.5 text-xs text-muted-foreground">{item.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <Card
            key={feature.title}
            className={`card-hover group border-2 bg-card/60 backdrop-blur ${ENTRANCES[index]}`}
          >
            <CardHeader>
              <div
                className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${feature.tint} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
              >
                <feature.icon className="h-6 w-6" />
              </div>
              <CardTitle className="font-serif text-xl">{feature.title}</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                {feature.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="relative overflow-hidden rounded-3xl border-2 border-primary/25 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-1 shadow-xl shadow-purple-500/10">
        <div className="rounded-2xl bg-card px-6 py-8 sm:px-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl space-y-3">
              <Badge variant="purple" className="gap-1.5">
                <Terminal className="h-3.5 w-3.5" /> Java CP Lab
              </Badge>
              <h2 className="font-serif text-3xl font-bold sm:text-4xl">
                Write real Java. Compile it for real.
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                {JAVA_PROBLEMS.length} interview-grade problems across arrays, strings,
                stacks, DP and concurrency - compiled with{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
                  javac
                </code>{" "}
                and executed on your own machine. XP, levels and badges are saved to your
                account.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="btn-gradient shine h-14 px-8 text-lg shadow-xl shadow-purple-500/25"
            >
              <Link href="/java">
                Open the lab
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <h2 className="text-gradient font-serif text-3xl font-bold">How it works</h2>
          <p className="text-muted-foreground">
            Three minutes from this page to your first scored answer.
          </p>
        </div>

        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className={`rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur ${ENTRANCES[index]}`}
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 font-serif text-lg font-bold text-white shadow-lg">
                {index + 1}
              </span>
              <div className="mt-4 flex items-center gap-2">
                <step.icon className="h-4 w-4 text-primary" />
                <h3 className="font-serif text-lg font-semibold">{step.title}</h3>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
