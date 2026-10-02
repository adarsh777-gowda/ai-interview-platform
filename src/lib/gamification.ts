// Gamification logic for interview sessions. Pure functions so they are easy to test
// and reuse on both the dashboard and the interview screen. No external services.

import { averageScore } from "./utils";

export const XP_PER_RUBRIC_POINT = 10;
export const XP_PER_LEVEL = 250;
export const GOOD_TURN_THRESHOLD = 3.5;
export const WORD_BONUS_THRESHOLD = 60;
export const WORD_BONUS_XP = 15;

const LEVEL_TITLES = [
  "Rookie",
  "Apprentice",
  "Contender",
  "Interviewer's Friend",
  "Pro",
  "Senior Voice",
  "Expert",
  "Elite",
  "Legend",
  "Mythic",
];

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function turnXpFromScores(scores: Record<string, number> | null | undefined): number {
  if (!scores) return 0;
  const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
  return Math.round(total * XP_PER_RUBRIC_POINT);
}

export function wordBonusXp(words: number): number {
  return words >= WORD_BONUS_THRESHOLD ? WORD_BONUS_XP : 0;
}

export type TurnLike = {
  scoresJson: Record<string, number> | null;
  userAnswer: string;
};

export function xpFromTurns(turns: TurnLike[]): number {
  return turns.reduce(
    (sum, turn) =>
      sum + turnXpFromScores(turn.scoresJson) + wordBonusXp(countWords(turn.userAnswer)),
    0
  );
}

export type LevelInfo = {
  level: number;
  title: string;
  intoLevel: number;
  forNextLevel: number;
  progressPct: number;
};

export function computeLevel(xp: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(xp));
  const level = Math.floor(safeXp / XP_PER_LEVEL) + 1;
  const intoLevel = safeXp % XP_PER_LEVEL;
  return {
    level,
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] ?? "Mythic",
    intoLevel,
    forNextLevel: XP_PER_LEVEL,
    progressPct: Math.round((intoLevel / XP_PER_LEVEL) * 100),
  };
}

export function computeStreak(averages: Array<number | null>): number {
  let streak = 0;
  for (let i = averages.length - 1; i >= 0; i -= 1) {
    const value = averages[i];
    if (value !== null && value >= GOOD_TURN_THRESHOLD) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

export type BadgeDef = {
  id: string;
  label: string;
  description: string;
  emoji: string;
};

export const BADGES: BadgeDef[] = [
  { id: "first_answer", label: "First Steps", description: "Submit your first answer", emoji: "🐣" },
  { id: "perfect", label: "Perfectionist", description: "Score a perfect 5.0 on a question", emoji: "🌟" },
  { id: "streak3", label: "On Fire", description: "Get a 3-answer scoring streak", emoji: "🔥" },
  { id: "streak5", label: "Unstoppable", description: "Get a 5-answer scoring streak", emoji: "⚡" },
  { id: "explorer", label: "Explorer", description: "Answer questions across 3+ topics", emoji: "🧭" },
  { id: "deep", label: "Deep Diver", description: "Score 4.5+ on depth", emoji: "🤿" },
  { id: "wordsmith", label: "Wordsmith", description: "Write a 150+ word answer", emoji: "✍️" },
  { id: "marathon", label: "Marathoner", description: "Answer 10 questions in one session", emoji: "🏃" },
  { id: "completionist", label: "Completionist", description: "Answer every question in the session", emoji: "🏆" },
];

export function badgeById(id: string): BadgeDef | undefined {
  return BADGES.find((badge) => badge.id === id);
}

export type SessionStats = {
  answeredCount: number;
  totalQuestions: number;
  averages: Array<number | null>;
  topics: string[];
  maxDepth: number;
  maxWords: number;
  perfectCount: number;
};

export function earnedBadgeIds(stats: SessionStats): string[] {
  const earned: string[] = [];
  if (stats.answeredCount >= 1) earned.push("first_answer");
  if (stats.perfectCount >= 1) earned.push("perfect");
  const streak = computeStreak(stats.averages);
  if (streak >= 3) earned.push("streak3");
  if (streak >= 5) earned.push("streak5");
  if (new Set(stats.topics).size >= 3) earned.push("explorer");
  if (stats.maxDepth >= 4.5) earned.push("deep");
  if (stats.maxWords >= 150) earned.push("wordsmith");
  if (stats.answeredCount >= 10) earned.push("marathon");
  if (stats.totalQuestions > 0 && stats.answeredCount >= stats.totalQuestions) {
    earned.push("completionist");
  }
  return earned;
}

export type StatsTurn = {
  scoresJson: Record<string, number> | null;
  userAnswer: string;
  topic: string;
};

export function buildSessionStats(turns: StatsTurn[], totalQuestions: number): SessionStats {
  const averages = turns.map((turn) => averageScore(turn.scoresJson));
  const depths = turns.map((turn) => turn.scoresJson?.depth ?? 0);
  const words = turns.map((turn) => countWords(turn.userAnswer));
  return {
    answeredCount: turns.length,
    totalQuestions,
    averages,
    topics: turns.map((turn) => turn.topic),
    maxDepth: depths.length ? Math.max(...depths) : 0,
    maxWords: words.length ? Math.max(...words) : 0,
    perfectCount: averages.filter((avg) => avg === 5).length,
  };
}
