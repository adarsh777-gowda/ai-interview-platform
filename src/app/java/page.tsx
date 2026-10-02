import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Code2, Cpu } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { categorySummaries, clientProblems } from "@/lib/java/problems";
import { JavaLab } from "@/components/java/lab";

export const metadata = {
  title: "Java Lab | InterviewAI",
  description: "Free Java competitive programming lab - write, compile and run locally.",
};

export default async function JavaLabPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const categories = categorySummaries();
  const problems = clientProblems();

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/50 px-6 py-8 sm:px-8">
        <div className="grid-surface pointer-events-none absolute inset-0" />
        <div className="aurora pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="info" className="gap-1.5">
              <Code2 className="h-3.5 w-3.5" /> Java CP Lab
            </Badge>
            <h1 className="text-gradient font-serif text-4xl font-bold">Java Lab</h1>
            <p className="max-w-2xl text-muted-foreground">
              Write, compile and run real Java against {problems.length} interview
              problems - 100% free, compiled on your own machine.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info" className="gap-1.5">
              <Code2 className="h-3.5 w-3.5" /> javac + java
            </Badge>
            <Badge variant="success" className="gap-1.5">
              <Cpu className="h-3.5 w-3.5" /> runs locally
            </Badge>
            <Badge variant="purple">no credits, no limits</Badge>
          </div>
        </div>
      </section>

      <JavaLab categories={categories} />
    </div>
  );
}
