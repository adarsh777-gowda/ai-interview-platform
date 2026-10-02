import { Flame, Sparkles, Target, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { LevelInfo } from "@/lib/gamification";

export function GameHud({
  xp,
  level,
  streak,
  answered,
  total,
  badgeCount,
}: {
  xp: number;
  level: LevelInfo;
  streak: number;
  answered: number;
  total: number;
  badgeCount: number;
}) {
  const completion = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <Card className="overflow-hidden border-2">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 font-serif text-lg font-bold text-white shadow-lg">
              {level.level}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Level {level.level}</span>
                <Badge variant="purple" className="animate-pop-in">{level.title}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{xp} XP total</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-right">
            <div className="flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-amber-600 dark:text-amber-400">
              <Flame className="h-4 w-4" />
              <span className="text-sm font-semibold">{streak}</span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-purple-500/15 px-3 py-1 text-purple-600 dark:text-purple-400">
              <Trophy className="h-4 w-4" />
              <span className="text-sm font-semibold">{badgeCount}</span>
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
          <Progress value={level.progressPct} indicatorClassName="bg-gradient-to-r from-blue-500 to-purple-600" />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Target className="h-3.5 w-3.5" /> Questions
            </span>
            <span className="font-mono">
              {answered} / {total} answered
            </span>
          </div>
          <Progress value={completion} indicatorClassName="bg-gradient-to-r from-emerald-500 to-teal-500" />
        </div>
      </CardContent>
    </Card>
  );
}
