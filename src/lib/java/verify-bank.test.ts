// Verifies every `expected` value in the bank by running a known-good reference
// solution through the real javac/java pipeline.
//
// This takes ~30s (it compiles 18 programs and runs 72 JVMs), so it is opt-in:
//
//     JAVA_BANK_VERIFY=1 npx vitest run src/lib/java/verify-bank.test.ts
//
// Run it after editing any problem's tests. Without a JDK the suite skips.
import { describe, expect, it } from "vitest";

import { JAVA_PROBLEMS, allTestsFor } from "./problems";
import { executeJavaTests, isJavaAvailable } from "./process";
import { REFERENCE } from "./reference";

const enabled = process.env.JAVA_BANK_VERIFY === "1" && (await isJavaAvailable());

describe.skipIf(!enabled)("bank verification", () => {
  it("has a reference solution for every problem", () => {
    const missing = JAVA_PROBLEMS.filter((problem) => !REFERENCE[problem.id]).map((p) => p.id);
    expect(missing).toEqual([]);
  });

  it(
    "every expected output matches a correct implementation",
    async () => {
      const failures: string[] = [];

      for (const problem of JAVA_PROBLEMS) {
        const code = REFERENCE[problem.id];
        if (!code) continue;

        const outcome = await executeJavaTests(code, allTestsFor(problem), problem.difficulty);

        if (outcome.compileError) {
          failures.push(`${problem.id}: COMPILE ERROR\n${outcome.compileError}`);
          continue;
        }

        for (const result of outcome.summary.results) {
          if (!result.passed) {
            failures.push(
              `${problem.id} [${result.label}]\n` +
                `    input    = ${JSON.stringify(result.input)}\n` +
                `    expected = ${JSON.stringify(result.expected)}\n` +
                `    actual   = ${JSON.stringify(result.actual)}`
            );
          }
        }
      }

      expect(failures, `${failures.length} mismatched test(s)`).toEqual([]);
    },
    600_000
  );
});

describe("reference solutions exist", () => {
  it("covers every problem id", () => {
    expect(Object.keys(REFERENCE).sort()).toEqual(JAVA_PROBLEMS.map((p) => p.id).sort());
  });
});
