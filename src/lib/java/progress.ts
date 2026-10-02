// Gamification for the Java Competitive Programming Lab.
// Pure functions only (no browser/node APIs) so they are easy to unit test and
// reuse on the client. Progress itself is persisted to localStorage by the UI.

import type { JavaCategory, JavaProblem } from "./types";

export const LAB_XP_PER_LEVEL = 400;

const LAB_LEVEL_TITLES = [
  "Newcomer",
  "Loop Apprentice",
  "Array Adept",
  "Hash Hero",
  "Window Wizard",
  "Stack Strategist",
  "Heap Handler",
  "Graph Glider",
  "Design Architect",
  "Concurrency Champion",
  "Java Legend",
];

export type LabRecord = {
  /** Best score across attempts, 0-100. */
  best: number;
  /** True once every visible + hidden test passed. */
  solved: boolean;
  /** Best XP earned on this problem. */
  xp: number;
  attempts: number;
  /** True if the reference solution was revealed at least once. */
  usedSolution: boolean;
  lastRunAt: number;
  /** Fastest time-to-solve in ms (only set once solved). */
  bestDurationMs?: number;
};

export type LabProgress = Record<string, LabRecord>;

export function emptyRecord(): LabRecord {
  return { best: 0, solved: false, xp: 0, attempts: 0, usedSolution: false, lastRunAt: 0 };
}

export function totalXp(progress: LabProgress): number {
  return Object.values(progress).reduce((sum, record) => sum + (record.xp || 0), 0);
}

export function solvedCount(progress: LabProgress): number {
  return Object.values(progress).filter((record) => record.solved).length;
}

export type LabLevelInfo = {
  level: number;
  title: string;
  intoLevel: number;
  forNextLevel: number;
  progressPct: number;
};

export function computeLabLevel(xp: number): LabLevelInfo {
  const safe = Math.max(0, Math.floor(xp));
  const level = Math.floor(safe / LAB_XP_PER_LEVEL) + 1;
  const intoLevel = safe % LAB_XP_PER_LEVEL;
  return {
    level,
    title: LAB_LEVEL_TITLES[Math.min(level - 1, LAB_LEVEL_TITLES.length - 1)] ?? "Java Legend",
    intoLevel,
    forNextLevel: LAB_XP_PER_LEVEL,
    progressPct: Math.round((intoLevel / LAB_XP_PER_LEVEL) * 100),
  };
}

export type LabBadgeDef = {
  id: string;
  label: string;
  description: string;
  emoji: string;
};

export const LAB_BADGES: LabBadgeDef[] = [
  { id: "first_solve", label: "First Blood", description: "Fully solve your first problem", emoji: "🩸" },
  { id: "five_solves", label: "Getting Sharp", description: "Fully solve 5 problems", emoji: "🎯" },
  { id: "ten_solves", label: "Grinder", description: "Fully solve 10 problems", emoji: "⛏️" },
  { id: "hard_hero", label: "Hard Hero", description: "Fully solve a HARD problem", emoji: "🛡️" },
  { id: "explorer", label: "Explorer", description: "Solve problems in 3+ categories", emoji: "🧭" },
  { id: "no_peek", label: "No Peek", description: "Solve without revealing the solution", emoji: "🕶️" },
  { id: "speedrunner", label: "Speedrunner", description: "Solve a problem in under 5 minutes", emoji: "⚡" },
  { id: "persistent", label: "Persistent", description: "Reach 25 total run attempts", emoji: "🔁" },
];

export function labBadgeById(id: string): LabBadgeDef | undefined {
  return LAB_BADGES.find((badge) => badge.id === id);
}

export type LabBadgeInput = {
  id: string;
  difficulty: string;
  category: JavaCategory;
};

export function earnedLabBadgeIds(progress: LabProgress, problems: LabBadgeInput[]): string[] {
  const solved = problems.filter((problem) => progress[problem.id]?.solved);
  const attempts = Object.values(progress).reduce((sum, record) => sum + record.attempts, 0);
  const categories = new Set(solved.map((problem) => problem.category));
  const earned: string[] = [];

  if (solved.length >= 1) earned.push("first_solve");
  if (solved.length >= 5) earned.push("five_solves");
  if (solved.length >= 10) earned.push("ten_solves");
  if (solved.some((problem) => problem.difficulty === "HARD")) earned.push("hard_hero");
  if (categories.size >= 3) earned.push("explorer");
  if (solved.some((problem) => !progress[problem.id]?.usedSolution)) earned.push("no_peek");
  if (solved.some((problem) => (progress[problem.id]?.bestDurationMs ?? Infinity) <= 300_000)) {
    earned.push("speedrunner");
  }
  if (attempts >= 25) earned.push("persistent");

  return earned;
}

/** Total XP a fresh, perfect solve of this problem would be worth. */
export function problemXpCeiling(problem: Pick<JavaProblem, "difficulty">): number {
  if (problem.difficulty === "HARD") return 180 + 20;
  if (problem.difficulty === "MEDIUM") return 110 + 20;
  return 60 + 20;
}
