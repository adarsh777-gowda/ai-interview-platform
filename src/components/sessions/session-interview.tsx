"use client";

import { Sparkles } from "lucide-react";
import { Confetti } from "./confetti";
import { FeedbackPanel } from "./feedback-panel";
import { GameHud } from "./game-hud";
import { QuestionPanel } from "./question-panel";
import { useSessionGame } from "./use-session-game";
import { badgeById } from "@/lib/gamification";
import type { Question, Turn } from "./types";

export function SessionInterview({
  sessionId,
  questions,
  turns,
  totalQuestions,
}: {
  sessionId: string;
  questions: Question[];
  turns: Turn[];
  totalQuestions?: number;
}) {
  const game = useSessionGame({ sessionId, questions, turns, totalQuestions });

  return (
    <div className="space-y-6">
      {game.celebrate > 0 && <Confetti key={game.celebrate} />}

      {game.toast && (
        <div className="fixed right-4 top-20 z-50 space-y-2">
          {typeof game.toast.xp === "number" && game.toast.xp > 0 && (
            <div className="animate-pop-in rounded-lg border-2 border-purple-500/40 bg-background px-4 py-2 text-sm font-semibold shadow-lg">
              <Sparkles className="mr-1 inline h-4 w-4 text-purple-500" />+{game.toast.xp} XP
            </div>
          )}
          {game.toast.levelUp && (
            <div className="animate-pop-in rounded-lg border-2 border-blue-500/40 bg-background px-4 py-2 text-sm font-semibold shadow-lg">
              🚀 Level up! Level {game.toast.levelUp}
            </div>
          )}
          {game.toast.badges?.map((id) => {
            const badge = badgeById(id);
            if (!badge) return null;
            return (
              <div
                key={id}
                className="animate-pop-in rounded-lg border-2 border-amber-500/40 bg-background px-4 py-2 text-sm font-semibold shadow-lg"
              >
                {badge.emoji} {badge.label}
              </div>
            );
          })}
        </div>
      )}

      <GameHud
        xp={game.xp}
        level={game.level}
        streak={game.streak}
        answered={game.localTurns.length}
        total={game.total}
        badgeCount={game.earnedIds.length}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <QuestionPanel
          questions={questions}
          selectedQuestionId={game.selectedQuestionId}
          onSelectQuestion={game.setSelectedQuestionId}
          selectedQuestion={game.selectedQuestion}
          answer={game.answer}
          onAnswerChange={game.setAnswer}
          onSubmit={game.handleSubmit}
          loading={game.loading}
          error={game.error}
          elapsed={game.elapsed}
          showHints={game.showHints}
          onToggleHints={game.toggleHints}
          answeredIds={game.answeredIds}
        />
        <FeedbackPanel
          latest={game.latest}
          latestXp={game.latestXp}
          previous={game.previous}
          earnedIds={game.earnedIds}
        />
      </div>
    </div>
  );
}
