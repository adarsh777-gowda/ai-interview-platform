import { PrismaClient, QuestionType, Difficulty } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const questions = [
  {
    type: QuestionType.BEHAVIORAL,
    topic: "leadership",
    difficulty: Difficulty.MID,
    prompt: "Tell me about a time you led a project under a tight deadline. What was your approach?",
  },
  {
    type: QuestionType.BEHAVIORAL,
    topic: "conflict",
    difficulty: Difficulty.JUNIOR,
    prompt: "Describe a disagreement with a teammate and how you resolved it.",
  },
  {
    type: QuestionType.TECHNICAL,
    topic: "javascript",
    difficulty: Difficulty.MID,
    prompt: "Explain the event loop in JavaScript and how async/await fits into it.",
  },
  {
    type: QuestionType.CODING,
    topic: "arrays",
    difficulty: Difficulty.JUNIOR,
    prompt: "How would you find two numbers in an array that sum to a target value? Discuss time and space complexity.",
  },
  {
    type: QuestionType.SYSTEM_DESIGN,
    topic: "scalability",
    difficulty: Difficulty.SENIOR,
    prompt: "Design a URL shortener that handles 10k writes/sec. What are the key components and tradeoffs?",
  },
  {
    type: QuestionType.TECHNICAL,
    topic: "databases",
    difficulty: Difficulty.MID,
    prompt: "When would you choose SQL vs NoSQL for a new product feature?",
  },
  {
    type: QuestionType.BEHAVIORAL,
    topic: "failure",
    difficulty: Difficulty.SENIOR,
    prompt: "Tell me about a significant failure. What did you learn and what changed afterward?",
  },
  {
    type: QuestionType.CODING,
    topic: "trees",
    difficulty: Difficulty.MID,
    prompt: "Explain how you would validate if a binary tree is a valid binary search tree.",
  },
];

async function main() {
  for (const q of questions) {
    await prisma.question.upsert({
      where: { id: `seed-${q.topic}-${q.type}` },
      update: {},
      create: {
        id: `seed-${q.topic}-${q.type}`,
        ...q,
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

  console.log("Seed complete:", questions.length, "questions + demo user");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
