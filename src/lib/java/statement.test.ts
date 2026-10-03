import { describe, expect, it } from "vitest";

import { hasRequiredSections, isBulletLine, parseStatement } from "./statement";

const STRUCTURED = `Goal
Decide whether a bracket sequence is valid.

Input
A single line containing s.

Output
Print exactly true or false.

Constraints
- 1 <= s.length <= 10000
- s contains only brackets`;

describe("parseStatement", () => {
  it("splits a structured prompt into labelled sections", () => {
    const { sections, structured } = parseStatement(STRUCTURED);
    expect(structured).toBe(true);
    expect(sections.map((section) => section.name)).toEqual([
      "Goal",
      "Input",
      "Output",
      "Constraints",
    ]);
    expect(sections[0]?.lines).toEqual(["Decide whether a bracket sequence is valid."]);
    expect(sections[3]?.lines).toHaveLength(2);
  });

  it("matches headers case-insensitively", () => {
    const { sections } = parseStatement("GOAL\nDo a thing.\n\ninput\nA number.");
    expect(sections.map((section) => section.name)).toEqual(["Goal", "Input"]);
  });

  it("does not treat a sentence starting with a section word as a header", () => {
    const { sections, structured } = parseStatement("Goal\nOutput the result to stdout.");
    expect(structured).toBe(true);
    expect(sections).toHaveLength(1);
    expect(sections[0]?.lines).toEqual(["Output the result to stdout."]);
  });

  it("keeps legacy prose intact and reports it as unstructured", () => {
    const legacy = "Read n, then n integers, then a target. Print the two indices.";
    const { sections, structured } = parseStatement(legacy);
    expect(structured).toBe(false);
    expect(sections).toHaveLength(1);
    expect(sections[0]?.name).toBe("Goal");
    expect(sections[0]?.lines).toEqual([legacy]);
  });

  it("drops blank lines but preserves real content", () => {
    const { sections } = parseStatement("Goal\n\n\nFirst line.\n\nSecond line.\n\n");
    expect(sections[0]?.lines).toEqual(["First line.", "Second line."]);
  });

  it("returns no sections for an empty prompt", () => {
    const { sections, structured } = parseStatement("   \n  \n");
    expect(sections).toEqual([]);
    expect(structured).toBe(false);
  });

  it("recognises bullet lines", () => {
    expect(isBulletLine("- a constraint")).toBe(true);
    expect(isBulletLine("A constraint")).toBe(false);
  });
});

describe("hasRequiredSections", () => {
  it("accepts a prompt with Goal, Input and Output", () => {
    expect(hasRequiredSections(STRUCTURED)).toBe(true);
  });

  it("rejects a prompt missing Output", () => {
    expect(hasRequiredSections("Goal\nDo it.\n\nInput\nA number.")).toBe(false);
  });

  it("rejects legacy prose", () => {
    expect(hasRequiredSections("Read n and print the answer.")).toBe(false);
  });
});