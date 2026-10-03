import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { QUESTION_BANK } from "./questions";
import { planSuperseded, seedId } from "./question-identity";

const prisma = new PrismaClient();

async function main() {
  const ids = QUESTION_BANK.map(seedId);

  // Older versions of this seed used `seed-<topic>-<type>` (no index), which
  // collapses to a single row per topic+type. Prune those, but ONLY when no turn
  // references them: `InterviewTurn.question` is onDelete:Cascade, so deleting a
  // question a user has already answered would silently erase their history.
  const stale = await prisma.question.deleteMany({
    where: { id: { startsWith: "seed-", notIn: ids }, turns: { none: {} } },
  });
  if (stale.count > 0) {
    console.log(`Removed ${stale.count} unreferenced legacy question row(s).`);
  }

  for (const question of QUESTION_BANK) {
    // Deterministic ID keeps re-seeding idempotent while allowing many questions per topic.
    const id = seedId(question);
    await prisma.question.upsert({
      where: { id },
      update: {
        type: question.type,
        topic: question.topic,
        difficulty: question.difficulty,
        prompt: question.prompt,
      },
      create: {
        id,
        type: question.type,
        topic: question.topic,
        difficulty: question.difficulty,
        prompt: question.prompt,
      },
    });
  }

  // The prune above cannot touch rows a user has actually answered, so a question
  // that survived under an older id scheme would sit alongside its new hash twin
  // and the same prompt would be served twice. Move those turns onto the
  // canonical row first, then drop the now-empty duplicate.
  const rows = await prisma.question.findMany({
    select: { id: true, topic: true, type: true, difficulty: true, prompt: true },
  });
  const { repoint, remove } = planSuperseded(rows, new Set(ids));

  for (const { from, to } of repoint) {
    await prisma.interviewTurn.updateMany({
      where: { questionId: from },
      data: { questionId: to },
    });
  }
  if (remove.length > 0) {
    await prisma.question.deleteMany({ where: { id: { in: remove } } });
    console.log(`Merged ${remove.length} duplicate question row(s) into their canonical id.`);
  }

  const demoEmail = "demo@interviewai.dev";
  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      name: "Demo User",
      passwordHash,
    },
  });

  const total = await prisma.question.count();
  console.log(`Seed complete: ${QUESTION_BANK.length} bank questions, ${total} rows in db + demo user`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
