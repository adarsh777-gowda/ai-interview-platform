import { describe, expect, it } from "vitest";

import { contentKey, planSuperseded, seedId, type QuestionIdentity } from "./question-identity";

const BANK = {
  topic: "javascript",
  type: "TECHNICAL",
  difficulty: "MID",
  prompt: "Explain the event loop in JavaScript and how async/await fits into it.",
};

const OTHER = {
  topic: "react",
  type: "TECHNICAL",
  difficulty: "MID",
  prompt: "Explain how the useEffect hook works.",
};

function row(overrides: Partial<QuestionIdentity>): QuestionIdentity {
  return { id: "seed-x", ...BANK, ...overrides };
}

/** A full row built from a different question, so its content really differs. */
function otherRow(id: string): QuestionIdentity {
  return { id, ...OTHER };
}

describe("seedId", () => {
  it("is stable for the same content", () => {
    expect(seedId(BANK)).toBe(seedId({ ...BANK }));
  });

  it("changes when any part of the content changes", () => {
    expect(seedId(BANK)).not.toBe(seedId({ ...BANK, prompt: "something else" }));
    expect(seedId(BANK)).not.toBe(seedId({ ...BANK, difficulty: "SENIOR" }));
    expect(seedId(BANK)).not.toBe(seedId({ ...BANK, topic: "react" }));
  });

  it("does not depend on bank position", () => {
    // This is the point of hashing: reordering QUESTION_BANK must not rewrite ids.
    const a = seedId({ ...OTHER, prompt: "first" });
    const b = seedId({ ...OTHER, prompt: "second" });
    expect(a).not.toBe(b);
    expect(seedId({ ...OTHER, prompt: "first" })).toBe(a);
  });

  it("produces a prisma-safe id", () => {
    expect(seedId(BANK)).toMatch(/^seed-[0-9a-f]{64}$/);
  });
});

describe("contentKey", () => {
  it("ignores the id", () => {
    expect(contentKey(BANK)).toBe(contentKey({ ...BANK }));
  });
});

describe("planSuperseded", () => {
  it("does nothing when every row is already canonical", () => {
    const rows = [row({ id: seedId(BANK) }), otherRow(seedId(OTHER))];
    expect(planSuperseded(rows, new Set(rows.map((r) => r.id)))).toEqual({
      repoint: [],
      remove: [],
    });
  });

  it("repoints a stale twin onto the canonical row", () => {
    const canonical = seedId(BANK);
    const rows = [row({ id: "seed-javascript-TECHNICAL" }), row({ id: canonical })];

    const plan = planSuperseded(rows, new Set([canonical]));

    expect(plan.repoint).toEqual([{ from: "seed-javascript-TECHNICAL", to: canonical }]);
    expect(plan.remove).toEqual(["seed-javascript-TECHNICAL"]);
  });

  it("never removes the canonical row itself", () => {
    const canonical = seedId(BANK);
    const rows = [row({ id: "old-a" }), row({ id: "old-b" }), row({ id: canonical })];
    const plan = planSuperseded(rows, new Set([canonical]));

    expect(plan.remove).not.toContain(canonical);
    expect(plan.remove).toHaveLength(2);
    expect(plan.repoint.every((move) => move.to === canonical)).toBe(true);
  });

  it("leaves an edited prompt alone when no canonical twin exists", () => {
    // The user edited the prompt, so the old row is a genuinely different
    // historical question. Merging it would silently rewrite their history.
    const rows = [row({ id: "old-a" }), row({ id: "old-b", prompt: "a different prompt" })];
    expect(planSuperseded(rows, new Set([seedId(BANK)]))).toEqual({
      repoint: [],
      remove: [],
    });
  });

  it("handles three or more copies of the same question", () => {
    const canonical = seedId(BANK);
    const rows = ["old-a", "old-b", "old-c", canonical].map((id) => row({ id }));
    const plan = planSuperseded(rows, new Set([canonical]));

    expect(plan.remove).toHaveLength(3);
    expect(plan.repoint).toHaveLength(3);
  });

  it("does not merge questions that differ only by topic or difficulty", () => {
    const canonical = seedId(BANK);
    const rows = [
      row({ id: canonical }),
      row({ id: "other-topic", topic: "react" }),
      row({ id: "other-level", difficulty: "JUNIOR" }),
    ];
    expect(planSuperseded(rows, new Set([canonical]))).toEqual({ repoint: [], remove: [] });
  });
});