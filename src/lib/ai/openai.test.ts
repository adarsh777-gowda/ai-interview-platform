import { describe, expect, it } from "vitest";
import { extractJson, repairFeedback } from "./openai";
import { evaluationFeedbackSchema } from "./schemas";

describe("extractJson", () => {
  it("parses plain JSON", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it("extracts JSON from a markdown code fence", () => {
    const wrapped = '```json\n{"a":1,"b":"x"}\n```';
    expect(extractJson(wrapped)).toEqual({ a: 1, b: "x" });
  });

  it("extracts JSON embedded in prose", () => {
    const prose = 'Here is the result: {"a":1} thank you.';
    expect(extractJson(prose)).toEqual({ a: 1 });
  });

  it("throws on content with no JSON", () => {
    expect(() => extractJson("not json at all")).toThrow();
  });
});

describe("repairFeedback", () => {
  it("fills a missing summary instead of failing (the bug reported)", () => {
    const raw = {
      overallScore: 3,
      scores: { clarity: 3, structure: 3, correctness: 3, depth: 3 },
      strengths: ["Clear"],
      gaps: ["More depth"],
      suggestedAnswer: "Better answer",
      followUpQuestions: ["q1", "q2", "q3", "q4", "q5"],
    };
    const repaired = repairFeedback(raw);
    expect(typeof repaired.summary).toBe("string");
    expect(repaired.summary.length).toBeGreaterThan(0);
  });

  it("caps excess follow-up questions to 3 and returns valid feedback", () => {
    const repaired = repairFeedback({
      followUpQuestions: ["1", "2", "3", "4", "5"],
      strengths: [],
      gaps: [],
    });
    expect(repaired.followUpQuestions.length).toBe(3);
    expect(evaluationFeedbackSchema.safeParse(repaired).success).toBe(true);
  });

  it("fills missing arrays/strings with safe defaults", () => {
    const repaired = repairFeedback({ overallScore: 2 });
    expect(repaired.strengths.length).toBeGreaterThan(0);
    expect(repaired.gaps.length).toBeGreaterThan(0);
    expect(repaired.suggestedAnswer.length).toBeGreaterThan(0);
    expect(evaluationFeedbackSchema.safeParse(repaired).success).toBe(true);
  });
});