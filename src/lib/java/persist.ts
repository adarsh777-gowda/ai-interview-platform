// Bridge between Java Lab progress as the browser sees it (`LabProgress`, a
// plain object cached in localStorage) and `JavaLabProgress` rows in Postgres.
//
// Everything in here is pure - no Prisma, no fetch, no clock - so it can be
// unit tested and imported from both route handlers and client components.

import { emptyRecord, type LabProgress, type LabRecord } from "./progress";

/** One `JavaLabProgress` row as the API exposes it over JSON. */
export type ProgressRow = {
  problemId: string;
  solved: boolean;
  attempts: number;
  xp: number;
  best: number;
  usedSolution: boolean;
  /** Fastest solve so far, in ms. Null until solved. */
  bestDurationMs: number | null;
  /** Epoch ms of the most recent run. */
  lastRunAt: number;
};

const toInt = (value: unknown, fallback = 0): number => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
};

export function rowToRecord(row: ProgressRow): LabRecord {
  // `Number(null)` is 0, so a missing duration must be excluded explicitly
  // rather than routed through `toInt`.
  const hasDuration =
    row.bestDurationMs !== null && row.bestDurationMs !== undefined;
  const duration = hasDuration ? toInt(row.bestDurationMs, -1) : -1;
  return {
    best: Math.max(0, toInt(row.best)),
    solved: Boolean(row.solved),
    xp: Math.max(0, toInt(row.xp)),
    attempts: Math.max(0, toInt(row.attempts)),
    usedSolution: Boolean(row.usedSolution),
    lastRunAt: Math.max(0, toInt(row.lastRunAt)),
    ...(duration >= 0 ? { bestDurationMs: duration } : {}),
  };
}

export function rowsToProgress(rows: ProgressRow[]): LabProgress {
  const progress: LabProgress = {};
  for (const row of rows) progress[row.problemId] = rowToRecord(row);
  return progress;
}

/** Converts a Prisma `JavaLabProgress` row (with a `Date`) into a `ProgressRow`. */
export function dbRowToProgressRow(row: {
  problemId: string;
  solved: boolean;
  attempts: number;
  xp: number;
  best: number;
  usedSolution: boolean;
  bestDurationMs: number | null;
  lastRunAt: Date;
}): ProgressRow {
  return {
    problemId: row.problemId,
    solved: row.solved,
    attempts: row.attempts,
    xp: row.xp,
    best: row.best,
    usedSolution: row.usedSolution,
    bestDurationMs: row.bestDurationMs,
    lastRunAt: row.lastRunAt.getTime(),
  };
}

function mergeRecord(a: LabRecord, b: LabRecord): LabRecord {
  const durations = [a.bestDurationMs, b.bestDurationMs].filter(
    (value): value is number => typeof value === "number"
  );
  return {
    best: Math.max(a.best, b.best),
    solved: a.solved || b.solved,
    xp: Math.max(a.xp, b.xp),
    attempts: Math.max(a.attempts, b.attempts),
    usedSolution: a.usedSolution || b.usedSolution,
    lastRunAt: Math.max(a.lastRunAt, b.lastRunAt),
    ...(durations.length > 0 ? { bestDurationMs: Math.min(...durations) } : {}),
  };
}

/**
 * Field-wise max/OR merge so a user's progress only ever moves forward -
 * used to combine localStorage (possibly from another device) with the
 * database. Attempts are merged with max rather than sum so replaying the
 * same runs never inflates them.
 */
export function mergeProgress(a: LabProgress, b: LabProgress): LabProgress {
  const ids = new Set([...Object.keys(a), ...Object.keys(b)]);
  const merged: LabProgress = {};
  for (const id of ids) {
    merged[id] = mergeRecord(a[id] ?? emptyRecord(), b[id] ?? emptyRecord());
  }
  return merged;
}

/** Clamps a single record to sane, honest bounds (0-100 score, capped XP). */
export function clampRecord(
  record: LabRecord,
  xpCeiling: number
): LabRecord {
  const duration =
    typeof record.bestDurationMs === "number" && record.bestDurationMs >= 0
      ? Math.trunc(record.bestDurationMs)
      : undefined;
  return {
    best: Math.min(100, Math.max(0, toInt(record.best))),
    solved: Boolean(record.solved),
    xp: Math.min(Math.max(0, toInt(xpCeiling)), Math.max(0, toInt(record.xp))),
    attempts: Math.min(10_000, Math.max(0, toInt(record.attempts))),
    usedSolution: Boolean(record.usedSolution),
    lastRunAt: Math.max(0, toInt(record.lastRunAt)),
    ...(duration !== undefined ? { bestDurationMs: duration } : {}),
  };
}
