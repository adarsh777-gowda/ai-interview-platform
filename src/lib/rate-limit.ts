import { prisma } from "@/lib/prisma";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
};

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = new Date();
  const windowEnd = new Date(Math.ceil(now.getTime() / windowMs) * windowMs);

  const existing = await prisma.rateLimitEntry.findUnique({
    where: {
      key_windowEnd: { key, windowEnd },
    },
  });

  if (!existing) {
    await prisma.rateLimitEntry.create({
      data: { key, windowEnd, count: 1 },
    });
    return { allowed: true, remaining: maxRequests - 1, resetAt: windowEnd };
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: windowEnd };
  }

  const updated = await prisma.rateLimitEntry.update({
    where: { id: existing.id },
    data: { count: { increment: 1 } },
  });

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - updated.count),
    resetAt: windowEnd,
  };
}

export function logAiRequest(payload: Record<string, unknown>) {
  console.info("[ai-evaluate]", JSON.stringify(payload));
}
