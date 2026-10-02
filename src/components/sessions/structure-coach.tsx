"use client";

import { CheckCircle2, Circle, Lightbulb } from "lucide-react";
import { analyseAnswerStructure, hintsFor } from "@/lib/answer-coach";
import { countWords } from "@/lib/gamification";
import { cn } from "@/lib/utils";

export function StructureCoach({
  questionType,
  answer,
  showHints,
  onToggleHints,
}: {
  questionType: string;
  answer: string;
  showHints: boolean;
  onToggleHints: () => void;
}) {
  const analysis = analyseAnswerStructure(questionType, answer);
  const words = countWords(answer);
  const chars = answer.length;
  const ready = chars >= 20;
  const hints = hintsFor(questionType);

  return (
    <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          Structure coach · <span className="text-muted-foreground">{analysis.label}</span>
        </div>
        <button
          type="button"
          onClick={onToggleHints}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Lightbulb className="h-3.5 w-3.5" />
          {showHints ? "Hide hints" : "Show hints"}
        </button>
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2">
        {analysis.steps.map((step) => (
          <div key={step.key} className="flex items-center gap-2 text-sm">
            {step.met ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/50" />
            )}
            <span className={cn(step.met ? "text-foreground" : "text-muted-foreground")}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {showHints && (
        <ul className="animate-float-up space-y-1 border-t pt-3 text-xs text-muted-foreground">
          {hints.map((hint) => (
            <li key={hint} className="flex gap-2">
              <span className="text-primary">›</span>
              {hint}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between border-t pt-3 text-xs">
        <span className="text-muted-foreground">
          {words} words · {chars} chars
        </span>
        <span className={cn("font-medium", ready ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
          {ready ? "Ready to submit" : `${Math.max(0, 20 - chars)} more chars needed`}
        </span>
      </div>
    </div>
  );
}
