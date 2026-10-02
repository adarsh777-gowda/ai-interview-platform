import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { QUESTION_BANK } from "./questions";

const prisma = new PrismaClient();

async function main() {
  for (let i = 0; i < QUESTION_BANK.length; i += 1) {
    const question = QUESTION_BANK[i];
    // Deterministic ID keeps re-seeding idempotent while allowing many questions per topic.
    const id = `seed-${question.topic}-${question.type}-${i}`;
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
