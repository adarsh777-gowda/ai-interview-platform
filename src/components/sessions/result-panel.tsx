"use client";

import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RubricBars } from "./rubric-bars";
import { ScoreRing } from "./score-ring";
import type { Turn } from "./types";
import type { EvaluationFeedback } from "@/lib/ai/schemas";
import { averageScore } from "@/lib/utils";

function scoreVerdict(avg: number) {
  if (avg >= 4.5) return { label: "Outstanding", variant: "success" as const };
  if (avg >= 3.5) return { label: "Strong", variant: "info" as const };
  if (avg >= 2.5) return { label: "Developing", variant: "warning" as const };
  return { label: "Needs work", variant: "destructive" as const };
}

export function ResultPanel({
  turn,
  xpGained,
  latest,
}: {
  turn: Turn;
  xpGained?: number;
  latest?: boolean;
}) {
  const feedback = turn.aiFeedbackJson as EvaluationFeedback | null;
  const avg = averageScore(turn.scoresJson) ?? 0;
  const verdict = scoreVerdict(avg);

  return (
    <Card className={latest ? "border-2 shadow-lg animate-float-up" : ""} id={`turn-${turn.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base capitalize">{turn.question.topic}</CardTitle>
            <CardDescription>{turn.question.type}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={verdict.variant}>{verdict.label}</Badge>
            {typeof xpGained === "number" && xpGained > 0 && (
              <Badge variant="purple" className="animate-pop-in">
                <Sparkles className="h-3 w-3" /> +{xpGained} XP
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <ScoreRing score={avg} />
          {turn.scoresJson && (
            <div className="w-full flex-1">
              <RubricBars scores={turn.scoresJson} />
            </div>
          )}
        </div>

        {feedback && (
          <div className="space-y-3 border-t pt-4 text-sm">
            <div>
              <p className="font-medium">Summary</p>
              <p className="text-muted-foreground">{feedback.summary}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="font-medium text-emerald-600 dark:text-emerald-400">Strengths</p>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {feedback.strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium text-amber-600 dark:text-amber-400">Gaps</p>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {feedback.gaps.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </div>
            </div>
            <details className="group rounded-md border bg-muted/40 p-3">
              <summary className="cursor-pointer text-sm font-medium">
                Your answer &amp; model answer
              </summary>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="font-medium">Your answer</p>
                  <p className="text-muted-foreground">{turn.userAnswer}</p>
                </div>
                <div>
                  <p className="font-medium">Suggested answer</p>
                  <p className="text-muted-foreground">{feedback.suggestedAnswer}</p>
                </div>
                {feedback.followUpQuestions?.length > 0 && (
                  <div>
                    <p className="font-medium">Follow-up questions</p>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      {feedback.followUpQuestions.map((q) => (
                        <li key={q}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
