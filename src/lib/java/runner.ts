// Pure logic for the Java lab: output normalization, comparison, and scoring.
// Kept free of Node APIs so it is unit-testable.

export type JavaDifficulty = "EASY" | "MEDIUM" | "HARD";

export type TestCase = {
  label: string;
  input: string;
  expected: string;
  hidden?: boolean;
};

export type TestResult = {
  label: string;
  passed: boolean;
  hidden: boolean;
  input: string;
  expected: string;
  actual: string;
  error?: string;
};

export type RunSummary = {
  passed: number;
  total: number;
  score: number; // 0-100
  xp: number;
  results: TestResult[];
};

export const DIFFICULTY_XP: Record<JavaDifficulty, number> = {
  EASY: 60,
  MEDIUM: 110,
  HARD: 180,
};

// Matches `public class Foo`, `class Foo`, `public final class Foo`.
const CLASS_PATTERN = /\bpublic\s+(?:final\s+|abstract\s+)?class\s+([A-Za-z_$][\w$]*)/;

export function extractClassName(code: string): string | null {
  const match = code.match(CLASS_PATTERN);
  if (match) return match[1];
  const loose = code.match(/\bclass\s+([A-Za-z_$][\w$]*)/);
  return loose ? loose[1] : null;
}

export function hasMainMethod(code: string): boolean {
  return /static\s+void\s+main\s*\(/.test(code);
}

/** Normalizes output so trailing whitespace / line-ending differences never fail a test. */
export function normalizeOutput(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n+$/g, "")
    .trim();
}

export function outputsMatch(actual: string, expected: string): boolean {
  return normalizeOutput(actual) === normalizeOutput(expected);
}

export function summarize(results: TestResult[], difficulty: JavaDifficulty): RunSummary {
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const score = total === 0 ? 0 : Math.round((passed / total) * 100);
  const base = DIFFICULTY_XP[difficulty] ?? 100;
  // Partial credit for partial progress, plus a bonus for a clean sweep.
  const partial = Math.round(base * (total === 0 ? 0 : passed / total));
  const xp = passed === total && total > 0 ? base + 20 : partial;
  return { passed, total, score, xp, results };
}