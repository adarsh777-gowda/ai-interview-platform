import { describe, expect, it } from "vitest";
import { evaluationFeedbackSchema, submitTurnSchema } from "./schemas";

describe("evaluationFeedbackSchema", () => {
  it("accepts valid feedback", () => {
    const result = evaluationFeedbackSchema.safeParse({
      overallScore: 4,
      scores: { clarity: 4, structure: 4, correctness: 3, depth: 4 },
      strengths: ["Clear structure"],
      gaps: ["More depth on tradeoffs"],
      suggestedAnswer: "A stronger answer would include...",
      followUpQuestions: ["How would you scale this?"],
      summary: "Good answer with room to improve.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid scores", () => {
    const result = evaluationFeedbackSchema.safeParse({
      overallScore: 6,
      scores: { clarity: 4, structure: 4, correctness: 3, depth: 4 },
      strengths: ["Clear structure"],
      gaps: ["More depth"],
      suggestedAnswer: "Better answer",
      followUpQuestions: [],
      summary: "Summary",
    });

    expect(result.success).toBe(false);
  });
});

describe("submitTurnSchema", () => {
  it("accepts seeded question IDs (non-cuid) and a valid answer", () => {
    const result = submitTurnSchema.safeParse({
      questionId: "seed-javascript-TECHNICAL",
      userAnswer:
        "I would start by explaining the event loop, then describe how async/await queues callbacks onto it.",
    });

    expect(result.success).toBe(true);
  });

  it("accepts Prisma cuid question IDs", () => {
    const result = submitTurnSchema.safeParse({
      questionId: "cm5l3k2abc123456789abcd",
      userAnswer:
        "I would start by explaining the event loop, then describe how async/await queues callbacks onto it.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty questionId or an answer under 20 chars", () => {
    const emptyId = submitTurnSchema.safeParse({ questionId: "", userAnswer: "x".repeat(20) });
    const shortAnswer = submitTurnSchema.safeParse({
      questionId: "seed-javascript-TECHNICAL",
      userAnswer: "too short",
    });

    expect(emptyId.success).toBe(false);
    expect(shortAnswer.success).toBe(false);
  });
});
