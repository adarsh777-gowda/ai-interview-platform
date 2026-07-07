import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const interviewSession = await prisma.interviewSession.findFirst({
    where: { id, userId: session.user.id },
    include: {
      turns: {
        include: { question: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!interviewSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(interviewSession);
}
