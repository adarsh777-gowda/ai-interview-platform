import { describe, expect, it } from "vitest";

import {
  DIFFICULTY_XP,
  extractClassName,
  hasMainMethod,
  normalizeOutput,
  outputsMatch,
  summarize,
  type TestResult,
} from "./runner";

function result(passed: boolean): TestResult {
  return {
    label: passed ? "passing case" : "failing case",
    passed,
    hidden: false,
    input: "in",
    expected: "exp",
    actual: passed ? "exp" : "nope",
  };
}

describe("extractClassName", () => {
  it("reads a public class", () => {
    expect(extractClassName("public class Main { }")).toBe("Main");
  });

  it("reads a modifier-heavy declaration", () => {
    expect(extractClassName("public final class Solution { }")).toBe("Solution");
  });

  it("falls back to a non-public class", () => {
    expect(extractClassName("class Foo {}")).toBe("Foo");
  });

  it("returns null when there is no class", () => {
    expect(extractClassName("int a = 1;")).toBeNull();
  });
});

describe("hasMainMethod", () => {
  it("detects a standard main", () => {
    expect(hasMainMethod("public static void main(String[] args) {}")).toBe(true);
  });

  it("rejects a different entry point", () => {
    expect(hasMainMethod("public static void run(String[] args) {}")).toBe(false);
  });
});

describe("normalizeOutput", () => {
  it("trims trailing whitespace, blank lines and CRLF", () => {
    expect(normalizeOutput("0 1  \r\n\r\n")).toBe("0 1");
  });

  it("keeps inner spacing significant", () => {
    expect(normalizeOutput("a  b")).toBe("a  b");
  });

  it("treats whitespace-only output as empty", () => {
    expect(normalizeOutput("   ")).toBe("");
  });

  it("collapses a trailing newline that println adds", () => {
    expect(normalizeOutput("true\n")).toBe("true");
  });
});

describe("outputsMatch", () => {
  it("ignores trailing newlines and CRLF", () => {
    expect(outputsMatch("true\r\n", "true")).toBe(true);
  });

  it("still fails on a genuinely different value", () => {
    expect(outputsMatch("0 1", "0 2")).toBe(false);
  });

  it("does not collapse internal whitespace", () => {
    expect(outputsMatch("1 2", "1  2")).toBe(false);
  });
});

describe("summarize", () => {
  it("scores partial credit against the difficulty base", () => {
    const summary = summarize([result(true), result(true), result(false)], "MEDIUM");
    expect(summary).toMatchObject({ passed: 2, total: 3, score: 67 });
    expect(summary.xp).toBe(73);
  });

  it("adds a bonus when every test passes", () => {
    const summary = summarize([result(true), result(true)], "EASY");
    expect(summary.score).toBe(100);
    expect(summary.xp).toBe(DIFFICULTY_XP.EASY + 20);
  });

  it("returns zero for an empty run", () => {
    expect(summarize([], "HARD")).toMatchObject({
      passed: 0,
      total: 0,
      score: 0,
      xp: 0,
    });
  });

  it("prices each difficulty", () => {
    expect(DIFFICULTY_XP).toEqual({ EASY: 60, MEDIUM: 110, HARD: 180 });
  });
});
