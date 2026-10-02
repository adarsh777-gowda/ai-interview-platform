"use client";

import { useEffect, useMemo, useState } from "react";
import { averageScore } from "@/lib/utils";
import {
  buildSessionStats,
  computeLevel,
  computeStreak,
  countWords,
  earnedBadgeIds,
  turnXpFromScores,
  wordBonusXp,
  xpFromTurns,
} from "@/lib/gamification";
import type { Question, Turn } from "@/components/sessions/types";

function formatError(error: unknown): string {
  if (typeof error === "string") return error;
  if (Array.isArray(error)) return error.map(formatError).join(", ");
  if (typeof error === "object" && error) {
    const o = error as { formErrors?: unknown; message?: unknown };
    if (Array.isArray(o.formErrors)) return o.formErrors.map(String).join(", ");
    if (o.message) return String(o.message);
  }
  return "Failed to submit answer";
}

export type Toast = { xp?: number; levelUp?: number; badges?: string[] };

export function useSessionGame({
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
  const [localTurns, setLocalTurns] = useState<Turn[]>(turns);
  const total = totalQuestions ?? questions.length;

  const answeredIds = useMemo(() => new Set(localTurns.map((t) => t.questionId)), [localTurns]);
  const firstUnanswered = questions.find((q) => !answeredIds.has(q.id)) ?? questions[0];
  const [selectedQuestionId, setSelectedQuestionId] = useState(firstUnanswered?.id ?? "");

  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [celebrate, setCelebrate] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);

  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId);

  const xp = useMemo(
    () => xpFromTurns(localTurns.map((t) => ({ scoresJson: t.scoresJson, userAnswer: t.userAnswer }))),
    [localTurns]
  );
  const level = computeLevel(xp);
  const streak = computeStreak(localTurns.map((t) => averageScore(t.scoresJson)));
  const statsTurns = useMemo(
    () => localTurns.map((t) => ({ scoresJson: t.scoresJson, userAnswer: t.userAnswer, topic: t.question.topic })),
    [localTurns]
  );
  const earnedIds = useMemo(
    () => earnedBadgeIds(buildSessionStats(statsTurns, total)),
    [statsTurns, total]
  );

  useEffect(() => {
    setElapsed(0);
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [selectedQuestionId]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (celebrate === 0) return;
    const id = setTimeout(() => setCelebrate(0), 2600);
    return () => clearTimeout(id);
  }, [celebrate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedQuestionId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/turns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: selectedQuestionId, userAnswer: answer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(formatError(data.error) || "Failed to submit answer");

      const newTurn: Turn = {
        id: data.id,
        questionId: data.questionId,
        userAnswer: data.userAnswer,
        aiFeedbackJson: data.aiFeedbackJson,
        scoresJson: data.scoresJson,
        question: {
          prompt: data.question.prompt,
          topic: data.question.topic,
          type: data.question.type,
        },
      };

      const scores = data.scoresJson as Record<string, number> | null;
      const avg = averageScore(scores) ?? 0;
      const gained = turnXpFromScores(scores) + wordBonusXp(countWords(newTurn.userAnswer));
      const prevLevel = computeLevel(xp).level;
      const nextLevel = computeLevel(xp + gained).level;
      const prevEarned = new Set(earnedIds);

      const nextTurns = [...localTurns, newTurn];
      setLocalTurns(nextTurns);
      setAnswer("");

      const updatedAnswered = new Set([...answeredIds, data.questionId]);
      const nextQ = questions.find((q) => !updatedAnswered.has(q.id));
      if (nextQ) setSelectedQuestionId(nextQ.id);

      const nextStats = buildSessionStats(
        nextTurns.map((t) => ({ scoresJson: t.scoresJson, userAnswer: t.userAnswer, topic: t.question.topic })),
        total
      );
      const newBadges = earnedBadgeIds(nextStats).filter((id) => !prevEarned.has(id));

      setToast({
        xp: gained,
        levelUp: nextLevel > prevLevel ? nextLevel : undefined,
        badges: newBadges.length > 0 ? newBadges : undefined,
      });
      if (avg >= 4.5) setCelebrate((c) => c + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const latest = localTurns[localTurns.length - 1];
  const latestXp = latest
    ? turnXpFromScores(latest.scoresJson) + wordBonusXp(countWords(latest.userAnswer))
    : 0;
  const previous = localTurns.slice(0, -1).reverse();

  return {
    localTurns,
    total,
    answeredIds,
    selectedQuestionId,
    setSelectedQuestionId,
    selectedQuestion,
    answer,
    setAnswer,
    loading,
    error,
    showHints,
    toggleHints: () => setShowHints((v) => !v),
    elapsed,
    handleSubmit,
    xp,
    level,
    streak,
    earnedIds,
    latest,
    latestXp,
    previous,
    celebrate,
    toast,
  };
}
