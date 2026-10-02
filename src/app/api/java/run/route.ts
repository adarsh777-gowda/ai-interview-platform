import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { checkRateLimit } from "@/lib/rate-limit";
import { findProblem, allTestsFor } from "@/lib/java/problems";
import { executeJavaTests } from "@/lib/java/process";

export const runtime = "nodejs";
export const maxDuration = 60;

const runSchema = z.object({
  problemId: z.string().min(1).max(120),
  code: z.string().min(1).max(100_000),
});

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
