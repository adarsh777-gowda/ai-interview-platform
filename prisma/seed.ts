import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { QUESTION_BANK } from "./questions";

const prisma = new PrismaClient();

/** Stable, collision-free id: the index lets one topic/type hold several prompts. */
function seedId(topic: string, type: string, index: number): string {
  return `seed-${topic}-${type}-${index}`;
}

async function main() {
  const ids = QUESTION_BANK.map((question, index) =>
    seedId(question.topic, question.type, index)
  );

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

  for (let i = 0; i < QUESTION_BANK.length; i += 1) {
    const question = QUESTION_BANK[i];
    // Deterministic ID keeps re-seeding idempotent while allowing many questions per topic.
    const id = seedId(question.topic, question.type, i);
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

  console.log("Seed complete:", QUESTION_BANK.length, "questions + demo user");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
