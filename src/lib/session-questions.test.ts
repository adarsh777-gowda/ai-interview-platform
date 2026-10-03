import { describe, expect, it } from "vitest";

import {
  pickSessionQuestions,
  SESSION_QUESTION_LIMIT,
  type SelectableQuestion,
} from "./session-questions";

function q(
  id: string,
  topic: string,
  difficulty: SelectableQuestion["difficulty"]
): SelectableQuestion {
  return { id, topic, difficulty, type: "TECHNICAL" };
}

const POOL: SelectableQuestion[] = [
  q("r-junior", "react", "JUNIOR"),
  q("r-mid", "react", "MID"),
  q("r-senior", "react", "SENIOR"),
  q("p-junior", "python", "JUNIOR"),
  q("p-mid", "python", "MID"),
  q("p-senior", "python", "SENIOR"),
  q("d-junior", "databases", "JUNIOR"),
  q("d-mid", "databases", "MID"),
];

describe("pickSessionQuestions", () => {
  it("returns nothing for an empty pool", () => {
    expect(pickSessionQuestions([], { topics: ["react"], level: "MID" })).toEqual([]);
  });

  it("never returns an empty list when the pool has anything in it", () => {
    // The regression: strict topic+level filtering used to yield zero questions.
    const picked = pickSessionQuestions(POOL, { topics: ["react"], level: "JUNIOR" });
    expect(picked.length).toBeGreaterThan(0);
  });

  it("puts exact topic + level matches first", () => {
    const picked = pickSessionQuestions(POOL, { topics: ["react"], level: "MID" });
    expect(picked[0]?.id).toBe("r-mid");
  });

  it("keeps every selected topic represented before widening the pool", () => {
    const picked = pickSessionQuestions(POOL, {
      topics: ["react", "python"],
      level: "MID",
      limit: 4,
    });
    expect(picked.length).toBe(4);
    const topics = picked.map((question) => question.topic);
    expect(topics).toContain("react");
    expect(topics).toContain("python");
  });

  it("interleaves topics instead of finishing one topic first", () => {
    const picked = pickSessionQuestions(POOL, {
      topics: ["react", "python"],
      level: "MID",
      limit: 4,
    });
    const topics = picked.map((question) => question.topic);
    expect(topics.slice(0, 2).sort()).toEqual(["python", "react"]);
  });

  it("falls back to same-topic questions when the level has no match", () => {
    const pool = [q("a", "react", "MID"), q("b", "react", "SENIOR")];
    const picked = pickSessionQuestions(pool, { topics: ["react"], level: "JUNIOR" });
    expect(picked.map((question) => question.id)).toEqual(["a", "b"]);
  });

  it("falls back to off-topic questions when a topic is missing entirely", () => {
    const picked = pickSessionQuestions(POOL, { topics: ["rust"], level: "MID", limit: 2 });
    expect(picked.length).toBe(2);
    expect(picked.every((question) => question.difficulty === "MID")).toBe(true);
  });

  it("respects the limit and defaults to SESSION_QUESTION_LIMIT", () => {
    const many = Array.from({ length: 40 }, (_, i) =>
      q(`x-${i}`, i % 2 === 0 ? "react" : "python", "MID")
    );
    expect(pickSessionQuestions(many, { topics: ["react"], level: "MID" }).length).toBe(
      SESSION_QUESTION_LIMIT
    );
    expect(
      pickSessionQuestions(many, { topics: ["react"], level: "MID", limit: 3 }).length
    ).toBe(3);
  });

  it("never repeats a question", () => {
    const picked = pickSessionQuestions(POOL, {
      topics: ["react", "python", "databases"],
      level: "MID",
    });
    expect(new Set(picked.map((question) => question.id)).size).toBe(picked.length);
  });
});