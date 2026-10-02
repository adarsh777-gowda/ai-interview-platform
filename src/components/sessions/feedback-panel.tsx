"use client";

import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ResultPanel } from "./result-panel";
import { BADGES } from "@/lib/gamification";
import type { Turn } from "./types";

export function FeedbackPanel({
  latest,
  latestXp,
  previous,
  earnedIds,
}: {
  latest?: Turn;
  latestXp: number;
  previous: Turn[];
  earnedIds: string[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Session feedback</h2>
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <Trophy className="h-4 w-4" /> {earnedIds.length}/{BADGES.length} badges
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {BADGES.map((badge) => {
          const earned = earnedIds.includes(badge.id);
          return (
            <span
              key={badge.id}
              title={`${badge.label}: ${badge.description}`}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-all ${
                earned
                  ? "border-amber-500/40 bg-amber-500/10 font-semibold text-amber-600 dark:text-amber-400"
                  : "border-dashed text-muted-foreground/60 grayscale"
              }`}
            >
              <span>{badge.emoji}</span>
              {badge.label}
            </span>
          );
        })}
      </div>

      {!latest ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            No answers yet. Submit your first response to earn XP and see AI feedback.
          </CardContent>
        </Card>
      ) : (
        <>
          <ResultPanel turn={latest} xpGained={latestXp} latest />
          {previous.map((turn) => (
            <ResultPanel key={turn.id} turn={turn} />
          ))}
        </>
      )}
    </div>
  );
}
