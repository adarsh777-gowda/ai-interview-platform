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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Java Lab
          </h1>
          <p className="text-lg text-muted-foreground">
            Write, compile and run real Java against {problems.length} interview problems - 100%
            free, compiled on your own machine.
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

      <JavaLab categories={categories} />
    </div>
  );
}
