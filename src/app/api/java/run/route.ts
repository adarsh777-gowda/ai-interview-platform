import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { findProblem, allTestsFor } from "@/lib/java/problems";
import { executeJavaTests, type JavaRunOutcome } from "@/lib/java/process";
import type { JavaProblem } from "@/lib/java/types";
import { dbRowToProgressRow, rowToRecord } from "@/lib/java/persist";
import { emptyRecord } from "@/lib/java/progress";

export const runtime = "nodejs";
export const maxDuration = 60;

// Client-reported: ms since the player opened the problem. Only feeds the
// cosmetic "Speedrunner" badge, so it is clamped rather than trusted.
const MAX_ELAPSED_MS = 24 * 60 * 60 * 1000;

const runSchema = z.object({
  problemId: z.string().min(1).max(120),
  code: z.string().min(1).max(100_000),
  elapsedMs: z.number().min(0).max(MAX_ELAPSED_MS).optional(),
});

/**
 * Records the run against the user's account. XP and the score come from the
 * server's own evaluation, so they cannot be inflated from the browser.
 * Failures are swallowed by the caller - a DB hiccup should not fail the run.
 */
async function persistRun(
  userId: string,
  problem: JavaProblem,
  outcome: JavaRunOutcome,
  elapsedMs?: number
) {
  const existing = await prisma.javaLabProgress.findUnique({
    where: { userId_problemId: { userId, problemId: problem.id } },
  });
  const previous = existing ? rowToRecord(dbRowToProgressRow(existing)) : emptyRecord();

  const solved = previous.solved || outcome.solved;
  const bestDurationMs =
    solved &&
    typeof elapsedMs === "number" &&
    (previous.bestDurationMs === undefined || elapsedMs < previous.bestDurationMs)
      ? Math.trunc(elapsedMs)
      : previous.bestDurationMs;

  const data = {
    solved,
    attempts: previous.attempts + 1,
    xp: Math.max(previous.xp, outcome.summary.xp),
    best: Math.max(previous.best, outcome.summary.score),
    usedSolution: previous.usedSolution,
    bestDurationMs: bestDurationMs ?? null,
    lastRunAt: new Date(),
  };

  await prisma.javaLabProgress.upsert({
    where: { userId_problemId: { userId, problemId: problem.id } },
    create: { userId, problemId: problem.id, ...data },
    update: data,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = runSchema.safeParse(body);
  if (!parsed.success) {
    const message =
      parsed.error.issues.map((issue) => issue.message).join(", ") || "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const problem = findProblem(parsed.data.problemId);
  if (!problem) {
    return NextResponse.json({ error: "Problem not found" }, { status: 404 });
  }

  const maxRequests = Number(process.env.JAVA_RUN_RATE_LIMIT_MAX || 20);
  const windowMs = Number(process.env.JAVA_RUN_RATE_LIMIT_WINDOW_MS || 60_000);
  const rate = await checkRateLimit(`java-run:${session.user.id}`, maxRequests, windowMs);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many runs in the last minute - slow down a little." },
      { status: 429 }
    );
  }

  try {
    // Visible examples first, then hidden tests, so early failures are legible.
    const outcome = await executeJavaTests(
      parsed.data.code,
      allTestsFor(problem),
      problem.difficulty
    );

    try {
      await persistRun(session.user.id, problem, outcome, parsed.data.elapsedMs);
    } catch (error) {
      console.error("java run: could not persist progress", error);
    }

    return NextResponse.json({
      compileError: outcome.compileError ?? null,
      summary: outcome.summary,
      solved: outcome.solved,
      durationMs: outcome.durationMs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Run failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
