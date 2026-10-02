// Integration tests for the javac/java pipeline: real compiles, real runs.
// Requires a JDK on PATH - without one the whole suite skips.
//
//     npx vitest run src/lib/java/process.test.ts
import { describe, expect, it } from "vitest";

import { executeJavaTests, isJavaAvailable } from "./process";

const javaOk = await isJavaAvailable();
const tests = [{ label: "case", input: "1", expected: "1" }];

describe.skipIf(!javaOk)("executeJavaTests", () => {
  it("reports a friendly error when there is no main method", async () => {
    const out = await executeJavaTests("public class Main { int x = 1; }", tests, "EASY");
    expect(out.compileError).toContain("main");
    expect(out.solved).toBe(false);
    expect(out.summary.total).toBe(0);
  });

  it("surfaces javac errors without leaking the temp directory", async () => {
    const code = "public class Main { public static void main(String[] a) { int x = ; } }";
    const out = await executeJavaTests(code, tests, "EASY");
    expect(out.compileError).toBeTruthy();
    expect(out.compileError).not.toContain("java-lab-");
    expect(out.compileError).not.toContain("\\");
    expect(out.solved).toBe(false);
  });

  it("kills an infinite loop and reports a timeout", async () => {
    const code =
      "public class Main { public static void main(String[] a) { while (true) { } } }";
    const out = await executeJavaTests(code, tests, "EASY");
    const result = out.summary.results[0];
    expect(result.passed).toBe(false);
    expect(result.error).toMatch(/Timed out/);
    expect(out.solved).toBe(false);
  }, 30_000);

  it("captures an uncaught exception with its stack trace", async () => {
    const code =
      'public class Main { public static void main(String[] a) { throw new RuntimeException("boom"); } }';
    const out = await executeJavaTests(code, tests, "EASY");
    const result = out.summary.results[0];
    expect(result.passed).toBe(false);
    expect(result.error).toContain("boom");
    expect(result.error).not.toContain("java-lab-");
    expect(out.solved).toBe(false);
  }, 30_000);

  it("passes a correct solution and awards xp", async () => {
    const code = 'public class Main { public static void main(String[] a) { System.out.println(1); } }';
    const out = await executeJavaTests(code, tests, "EASY");
    expect(out.compileError).toBeUndefined();
    expect(out.solved).toBe(true);
    expect(out.summary.xp).toBe(80);
  }, 30_000);

  it("fails on wrong output without marking it solved", async () => {
    const code = 'public class Main { public static void main(String[] a) { System.out.println(2); } }';
    const out = await executeJavaTests(code, tests, "MEDIUM");
    expect(out.solved).toBe(false);
    expect(out.summary.passed).toBe(0);
    expect(out.summary.score).toBe(0);
    expect(out.summary.xp).toBe(0);
  }, 30_000);
});
