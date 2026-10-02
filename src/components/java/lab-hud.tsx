import { Award, CheckCircle2, Flame, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  LAB_BADGES,
  computeLabLevel,
  earnedLabBadgeIds,
  solvedCount,
  totalXp,
  type LabBadgeInput,
  type LabProgress,
} from "@/lib/java/progress";

export function LabHud({
  progress,
  problems,
  totalProblems,
}: {
  progress: LabProgress;
  problems: LabBadgeInput[];
  totalProblems: number;
}) {
  const xp = totalXp(progress);
  const level = computeLabLevel(xp);
  const solved = solvedCount(progress);
  const attempts = Object.values(progress).reduce((sum, r) => sum + r.attempts, 0);
  const earned = new Set(earnedLabBadgeIds(progress, problems));
  const completion = totalProblems > 0 ? Math.round((solved / totalProblems) * 100) : 0;

  return (
    <Card className="overflow-hidden border-2">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 font-serif text-lg font-bold text-white shadow-lg">
              {level.level}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Level {level.level}</span>
                <Badge variant="purple" className="animate-pop-in">
                  {level.title}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{xp} XP total</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-right">
            <div className="flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-amber-600 dark:text-amber-400">
              <Flame className="h-4 w-4" />
              <span className="text-sm font-semibold">{attempts} runs</span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-semibold">
                {solved}/{totalProblems}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Level progress
            </span>
            <span className="font-mono">
              {level.intoLevel} / {level.forNextLevel} XP
            </span>
          </div>
          <Progress
            value={level.progressPct}
            indicatorClassName="bg-gradient-to-r from-blue-500 to-purple-600"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Problems solved
            </span>
            <span className="font-mono">{completion}%</span>
          </div>
          <Progress value={completion} indicatorClassName="bg-gradient-to-r from-emerald-500 to-teal-500" />
        </div>

        <div className="space-y-2">
          <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Award className="h-3.5 w-3.5" /> Badges
          </p>
          <div className="flex flex-wrap gap-2">
            {LAB_BADGES.map((badge) => {
              const has = earned.has(badge.id);
              return (
                <span
                  key={badge.id}
                  title={`${badge.label}: ${badge.description}`}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                    has
                      ? "border-transparent bg-purple-500/15 text-purple-600 dark:text-purple-400"
                      : "border-border text-muted-foreground opacity-50 grayscale"
                  }`}
                >
                  <span aria-hidden>{badge.emoji}</span>
                  {badge.label}
                </span>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
