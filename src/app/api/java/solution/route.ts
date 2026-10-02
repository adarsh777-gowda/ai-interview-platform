import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { findProblem } from "@/lib/java/problems";
import { REFERENCE } from "@/lib/java/reference";

export const runtime = "nodejs";
export const maxDuration = 30;

const solutionSchema = z.object({
  problemId: z.string().min(1).max(120),
});

/**
 * The editorial is deliberately NOT shipped with the problem payload, so a
 * player has to deliberately ask for it (and their `usedSolution` flag flips
 * in the UI, which blocks the "No Peek" badge).
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = solutionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const problem = findProblem(parsed.data.problemId);
  if (!problem) {
    return NextResponse.json({ error: "Problem not found" }, { status: 404 });
  }

  const maxRequests = Number(process.env.JAVA_SOLUTION_RATE_LIMIT_MAX || 60);
  const windowMs = Number(process.env.JAVA_SOLUTION_RATE_LIMIT_WINDOW_MS || 60_000);
  const rate = await checkRateLimit(`java-solution:${session.user.id}`, maxRequests, windowMs);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // Persist the peek server-side so the No Peek badge stays blocked even if
  // the browser never syncs (or the player switches device after revealing).
  try {
    await prisma.javaLabProgress.upsert({
      where: {
        userId_problemId: { userId: session.user.id, problemId: problem.id },
      },
      create: { userId: session.user.id, problemId: problem.id, usedSolution: true },
      update: { usedSolution: true },
    });
  } catch (error) {
    console.error("java solution: could not persist usedSolution", error);
  }

  return NextResponse.json({
    problemId: problem.id,
    editorial: problem.editorial,
    followUps: problem.followUps,
    referenceCode: REFERENCE[problem.id] ?? null,
  });
}
