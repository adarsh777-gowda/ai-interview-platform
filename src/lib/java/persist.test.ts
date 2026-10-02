// Unit tests for the localStorage <-> Postgres merge helpers.
// Pure functions only, so these always run (no JDK / DB required).

import { describe, expect, it } from "vitest";

import {
  clampRecord,
  dbRowToProgressRow,
  mergeProgress,
  rowToRecord,
  rowsToProgress,
  type ProgressRow,
} from "./persist";
import { emptyRecord, problemXpCeiling, type LabProgress } from "./progress";
import type { JavaProblem } from "./types";

const baseRow = (over: Partial<ProgressRow> = {}): ProgressRow => ({
  problemId: "arrays-two-sum",
  solved: false,
  attempts: 0,
  xp: 0,
  best: 0,
  usedSolution: false,
  bestDurationMs: null,
  lastRunAt: 1_700_000_000_000,
  ...over,
});

const problem = (difficulty: JavaProblem["difficulty"]): JavaProblem =>
  ({ difficulty }) as JavaProblem;

describe("rowToRecord", () => {
  it("maps a fresh row onto the empty record shape", () => {
    expect(rowToRecord(baseRow())).toEqual({
      ...emptyRecord(),
      lastRunAt: 1_700_000_000_000,
    });
  });

  it("omits bestDurationMs when the row has none", () => {
    expect(rowToRecord(baseRow({ bestDurationMs: null })).bestDurationMs).toBeUndefined();
  });

  it("keeps a solve duration when present", () => {
    expect(rowToRecord(baseRow({ bestDurationMs: 4_321 })).bestDurationMs).toBe(4_321);
  });

  it("never yields negative counters", () => {
    const record = rowToRecord(
      baseRow({ attempts: -5, xp: -10, best: -1, lastRunAt: -99 })
    );
    expect(record.attempts).toBe(0);
    expect(record.xp).toBe(0);
    expect(record.best).toBe(0);
    expect(record.lastRunAt).toBe(0);
  });
});

describe("rowsToProgress", () => {
  it("keys rows by problem id", () => {
    const progress = rowsToProgress([
      baseRow({ problemId: "a", solved: true, xp: 60 }),
      baseRow({ problemId: "b", attempts: 3 }),
    ]);
    expect(Object.keys(progress).sort()).toEqual(["a", "b"]);
    expect(progress.a.solved).toBe(true);
    expect(progress.b.attempts).toBe(3);
  });

  it("returns an empty object for no rows", () => {
    expect(rowsToProgress([])).toEqual({});
  });
});

describe("mergeProgress", () => {
  const local: LabProgress = {
    "a-fast": {
      best: 100,
      solved: true,
      xp: 60,
      attempts: 4,
      usedSolution: false,
      lastRunAt: 1_000,
      bestDurationMs: 42_000,
    },
    "b-local-only": {
      best: 50,
      solved: false,
      xp: 30,
      attempts: 2,
      usedSolution: true,
      lastRunAt: 500,
    },
  };

  const server: LabProgress = {
    "a-fast": {
      best: 80,
      solved: true,
      xp: 60,
      attempts: 9,
      usedSolution: true,
      lastRunAt: 9_000,
      bestDurationMs: 120_000,
    },
    "c-server-only": {
      best: 100,
      solved: true,
      xp: 110,
      attempts: 1,
      usedSolution: false,
      lastRunAt: 7_000,
      bestDurationMs: 30_000,
    },
  };

  it("keeps the union of problems from both sides", () => {
    expect(Object.keys(mergeProgress(local, server)).sort()).toEqual([
      "a-fast",
      "b-local-only",
      "c-server-only",
    ]);
  });

  it("is order independent", () => {
    expect(mergeProgress(local, server)).toEqual(mergeProgress(server, local));
  });

  it("takes the best score, most XP and most attempts", () => {
    const merged = mergeProgress(local, server);
    expect(merged["a-fast"].best).toBe(100);
    expect(merged["a-fast"].xp).toBe(60);
    expect(merged["a-fast"].attempts).toBe(9);
  });

  it("ORs solved and usedSolution flags", () => {
    const merged = mergeProgress(local, server);
    expect(merged["a-fast"].solved).toBe(true);
    expect(merged["a-fast"].usedSolution).toBe(true);
    expect(merged["b-local-only"].usedSolution).toBe(true);
    expect(merged["b-local-only"].solved).toBe(false);
  });

  it("keeps the fastest solve duration", () => {
    expect(mergeProgress(local, server)["a-fast"].bestDurationMs).toBe(42_000);
  });

  it("keeps the most recent run timestamp", () => {
    expect(mergeProgress(local, server)["a-fast"].lastRunAt).toBe(9_000);
  });

  it("preserves records that exist on only one side", () => {
    const merged = mergeProgress(local, server);
    expect(merged["b-local-only"]).toEqual(local["b-local-only"]);
    expect(merged["c-server-only"]).toEqual(server["c-server-only"]);
  });

  it("does not mutate either input", () => {
    const before = JSON.stringify(local);
    mergeProgress(local, server);
    expect(JSON.stringify(local)).toBe(before);
  });
});

describe("dbRowToProgressRow", () => {
  it("turns a Prisma row into an API row", () => {
    const when = new Date("2024-05-01T12:00:00.000Z");
    const row = dbRowToProgressRow({
      problemId: "design-lru",
      solved: true,
      attempts: 3,
      xp: 180,
      best: 100,
      usedSolution: false,
      bestDurationMs: 12_345,
      lastRunAt: when,
    });
    expect(row.lastRunAt).toBe(when.getTime());
    expect(rowToRecord(row)).toEqual({
      best: 100,
      solved: true,
      xp: 180,
      attempts: 3,
      usedSolution: false,
      lastRunAt: when.getTime(),
      bestDurationMs: 12_345,
    });
  });

  it("round-trips into a progress map", () => {
    const when = new Date(1_700_000_000_000);
    const progress = rowsToProgress([
      dbRowToProgressRow({
        problemId: "x",
        solved: false,
        attempts: 1,
        xp: 0,
        best: 25,
        usedSolution: true,
        bestDurationMs: null,
        lastRunAt: when,
      }),
    ]);
    expect(progress.x.usedSolution).toBe(true);
    expect(progress.x.bestDurationMs).toBeUndefined();
  });
});

describe("clampRecord", () => {
  it("caps XP at the problem ceiling", () => {
    const record = clampRecord(
      { ...emptyRecord(), xp: 99_999, best: 900, attempts: 4 },
      problemXpCeiling(problem("EASY"))
    );
    expect(record.xp).toBe(80);
    expect(record.best).toBe(100);
  });

  it("clamps negatives and absurd attempt counts", () => {
    const record = clampRecord(
      { ...emptyRecord(), xp: -5, best: -1, attempts: 999_999 },
      200
    );
    expect(record.xp).toBe(0);
    expect(record.best).toBe(0);
    expect(record.attempts).toBe(10_000);
  });

  it("drops a negative duration", () => {
    const record = clampRecord(
      { ...emptyRecord(), bestDurationMs: -1 },
      80
    );
    expect(record.bestDurationMs).toBeUndefined();
  });
});
