import { describe, expect, it } from "vitest";

import { JAVA_CATEGORY_LABELS } from "./types";
import {
  JAVA_PROBLEMS,
  allTestsFor,
  categorySummaries,
  clientProblems,
  findProblem,
  problemsInCategory,
  toClientProblem,
} from "./problems";
import { extractClassName, hasMainMethod } from "./runner";
import { hasRequiredSections, parseStatement } from "./statement";

describe("problem bank", () => {
  it("ships at least 18 problems covering every category", () => {
    expect(JAVA_PROBLEMS.length).toBeGreaterThanOrEqual(18);
    const used = new Set(JAVA_PROBLEMS.map((problem) => problem.category));
    expect(used.size).toBe(Object.keys(JAVA_CATEGORY_LABELS).length);
  });

  it("uses unique ids so progress keys never collide", () => {
    const ids = JAVA_PROBLEMS.map((problem) => problem.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only uses declared categories", () => {
    for (const problem of JAVA_PROBLEMS) {
      expect(Object.keys(JAVA_CATEGORY_LABELS)).toContain(problem.category);
    }
  });

  it("gives every problem a complete write-up", () => {
    for (const problem of JAVA_PROBLEMS) {
      expect(problem.title.length).toBeGreaterThan(2);
      expect(problem.prompt.length).toBeGreaterThan(40);
      expect(problem.approach.length).toBeGreaterThanOrEqual(3);
      expect(problem.keyElements.length).toBeGreaterThanOrEqual(3);
      expect(problem.pitfalls.length).toBeGreaterThanOrEqual(3);
      expect(problem.followUps.length).toBeGreaterThanOrEqual(2);
      expect(problem.companies.length).toBeGreaterThanOrEqual(3);
      expect(problem.editorial.length).toBeGreaterThan(40);
    }
  });

  it("spells out Goal, Input and Output in every statement", () => {
    const vague: string[] = [];
    for (const problem of JAVA_PROBLEMS) {
      if (!hasRequiredSections(problem.prompt)) vague.push(problem.id);
    }
    // A statement that does not separate its I/O contract is the failure mode
    // this guards: players cannot tell what the program is meant to print.
    expect(vague, `unstated I/O contract: ${vague.join(", ")}`).toEqual([]);
  });

  it("states input sizes so the data model is unambiguous", () => {
    for (const problem of JAVA_PROBLEMS) {
      const { sections } = parseStatement(problem.prompt);
      const constraints = sections.find((section) => section.name === "Constraints");
      expect(constraints, `${problem.id} has no Constraints section`).toBeDefined();
      expect(constraints?.lines.length, `${problem.id} lists no constraints`).toBeGreaterThan(0);
    }
  });

  it("gives every problem a compilable starter skeleton", () => {
    for (const problem of JAVA_PROBLEMS) {
      expect(hasMainMethod(problem.starterCode)).toBe(true);
      expect(extractClassName(problem.starterCode)).toBe("Main");
    }
  });

  it("gives every problem at least one visible and one hidden test", () => {
    for (const problem of JAVA_PROBLEMS) {
      expect(problem.examples.length).toBeGreaterThanOrEqual(1);
      expect(problem.hiddenTests.length).toBeGreaterThanOrEqual(1);
      expect(problem.examples.some((test) => !test.hidden)).toBe(true);
      expect(problem.hiddenTests.every((test) => test.hidden === true)).toBe(true);

      for (const test of allTestsFor(problem)) {
        expect(test.label.length).toBeGreaterThan(0);
        expect(test.expected.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("selectors", () => {
  it("finds a problem by id", () => {
    const problem = findProblem("two-sum-indices");
    expect(problem?.title).toContain("Two Sum");
  });

  it("returns undefined for an unknown id", () => {
    expect(findProblem("does-not-exist")).toBeUndefined();
  });

  it("filters by category", () => {
    const arrays = problemsInCategory("arrays-hashing");
    expect(arrays.length).toBeGreaterThanOrEqual(1);
    expect(arrays.every((problem) => problem.category === "arrays-hashing")).toBe(true);
  });

  it("labels every category in a summary", () => {
    const summaries = categorySummaries();
    const total = summaries.reduce((sum, summary) => sum + summary.problems.length, 0);

    expect(total).toBe(JAVA_PROBLEMS.length);
    expect(summaries[0].id).toBe(JAVA_PROBLEMS[0].category);
    expect(summaries.map((summary) => summary.id)).toContain("streams-concurrency");
    for (const summary of summaries) {
      expect(summary.label).toBe(JAVA_CATEGORY_LABELS[summary.id]);
    }
  });
});

describe("toClientProblem", () => {
  it("strips the editorial and the hidden test contents", () => {
    const problem = findProblem("two-sum-indices");
    expect(problem).toBeDefined();
    if (!problem) return;

    const client = toClientProblem(problem);
    expect(client).not.toHaveProperty("editorial");
    expect(client).not.toHaveProperty("hiddenTests");
    expect(client.hiddenTestCount).toBe(problem.hiddenTests.length);
    expect(client.hiddenTestCount).toBeGreaterThan(0);
  });

  it("keeps everything the UI needs to render a problem", () => {
    const [client] = clientProblems();
    expect(client.prompt.length).toBeGreaterThan(0);
    expect(client.starterCode.length).toBeGreaterThan(0);
    expect(client.examples.length).toBeGreaterThan(0);
    expect(client.approach.length).toBeGreaterThan(0);
  });

  it("never leaks an editorial through the client payload", () => {
    for (const client of clientProblems()) {
      expect(client).not.toHaveProperty("editorial");
      expect(client).not.toHaveProperty("hiddenTests");
    }
  });
});
