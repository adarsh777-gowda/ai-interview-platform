import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { findProblem } from "@/lib/java/problems";
import {
  clampRecord,
  dbRowToProgressRow,
  mergeProgress,
  rowsToProgress,
} from "@/lib/java/persist";
import { problemXpCeiling, type LabProgress, type LabRecord } from "@/lib/java/progress";

export const runtime = "nodejs";
export const maxDuration = 30;

const recordSchema = z.object({
  best: z.number().optional(),
  solved: z.boolean().optional(),
  xp: z.number().optional(),
  attempts: z.number().optional(),
  usedSolution: z.boolean().optional(),
  lastRunAt: z.number().optional(),
  bestDurationMs: z.number().nullable().optional(),
});

const putSchema = z.object({
  progress: z.record(z.string().min(1).max(120), recordSchema),
});

function buildRecord(
  raw: z.infer<typeof recordSchema>,
  ceiling: number
): LabRecord {
  return clampRecord(
    {
      best: raw.best ?? 0,
      solved: raw.solved ?? false,
      xp: raw.xp ?? 0,
      attempts: raw.attempts ?? 0,
      usedSolution: raw.usedSolution ?? false,
      lastRunAt: raw.lastRunAt ?? 0,
      ...(typeof raw.bestDurationMs === "number"
        ? { bestDurationMs: raw.bestDurationMs }
        : {}),
    },
    ceiling
  );
}

function toRowData(record: LabRecord) {
  return {
    solved: record.solved,
    attempts: record.attempts,
    xp: record.xp,
    best: record.best,
    usedSolution: record.usedSolution,
    bestDurationMs: record.bestDurationMs ?? null,
    lastRunAt: record.lastRunAt > 0 ? new Date(record.lastRunAt) : new Date(),
  };
}

/** Snapshot of every problem the signed-in user has touched in the lab. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await prisma.javaLabProgress.findMany({
      where: { userId: session.user.id },
      orderBy: { problemId: "asc" },
    });
    return NextResponse.json({
      progress: rowsToProgress(rows.map(dbRowToProgressRow)),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load progress";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Adopts progress that already exists in the browser (e.g. saved before this
 * feature, or on another device) into the database.
 *
 * Values are clamped to what a legitimate solve could have earned, then
 * max-merged with the server row - so this can only ever move progress
 * forward and can never be used to lower someone's streak or raise XP past
 * the problem's ceiling. XP gained from running code is written by
 * POST /api/java/run, not from here.
 */
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    const message =
      parsed.error.issues.map((issue) => issue.message).join(", ") || "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const userId = session.user.id;

  const maxRequests = Number(process.env.JAVA_PROGRESS_RATE_LIMIT_MAX || 30);
  const windowMs = Number(process.env.JAVA_PROGRESS_RATE_LIMIT_WINDOW_MS || 60_000);
  const rate = await checkRateLimit(`java-progress:${userId}`, maxRequests, windowMs);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const rows = await prisma.javaLabProgress.findMany({ where: { userId } });
    const existing = rowsToProgress(rows.map(dbRowToProgressRow));

    // Ignore unknown ids so a tampered payload can't create orphan rows.
    const incoming: LabProgress = {};
    for (const [problemId, raw] of Object.entries(parsed.data.progress)) {
      const problem = findProblem(problemId);
      if (!problem) continue;
      incoming[problemId] = buildRecord(raw, problemXpCeiling(problem));
    }

    const merged = mergeProgress(existing, incoming);

    const writes = Object.keys(incoming)
      .map((problemId) => ({ problemId, record: merged[problemId] }))
      .filter(
        ({ problemId, record }) =>
          JSON.stringify(existing[problemId]) !== JSON.stringify(record)
      );

    if (writes.length > 0) {
      await prisma.$transaction(
        writes.map(({ problemId, record }) =>
          prisma.javaLabProgress.upsert({
            where: { userId_problemId: { userId, problemId } },
            create: { userId, problemId, ...toRowData(record) },
            update: toRowData(record),
          })
        )
      );
    }

    return NextResponse.json({ progress: merged, adopted: writes.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save progress";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
