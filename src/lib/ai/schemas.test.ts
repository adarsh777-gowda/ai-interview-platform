import { describe, expect, it } from "vitest";
import { evaluationFeedbackSchema } from "./schemas";

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
