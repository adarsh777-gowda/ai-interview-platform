import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionSchema } from "@/lib/ai/schemas";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await prisma.interviewSession.findMany({
    where: { userId: session.user.id },
    include: {
      turns: {
        select: { id: true, scoresJson: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const interviewSession = await prisma.interviewSession.create({
    data: {
      userId: session.user.id,
      role: parsed.data.role,
      level: parsed.data.level,
      topics: parsed.data.topics,
      status: "IN_PROGRESS",
    },
  });

  return NextResponse.json(interviewSession, { status: 201 });
}
