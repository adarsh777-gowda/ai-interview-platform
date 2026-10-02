// Node-only: compiles and runs user Java in a throwaway temp directory.
// Never import this from client code - it uses fs, os and child_process.

import { execFile, spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { JavaDifficulty, TestCase, TestResult } from "./runner";
import { extractClassName, hasMainMethod, outputsMatch, summarize, type RunSummary } from "./runner";

const COMPILE_TIMEOUT_MS = 15_000;
const RUN_TIMEOUT_MS = 4_000;
const MAX_OUTPUT_CHARS = 8_000;
const MAX_CODE_CHARS = 100_000;
const MAX_TESTS = 25;

const CLASS_NAME_PATTERN = /^[A-Za-z_$][\w$]*$/;

let javaAvailability: Promise<boolean> | null = null;

function toolAvailable(tool: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile(tool, ["-version"], { timeout: 5_000, windowsHide: true }, (error) => resolve(!error));
  });
}

/** Probes `javac`/`java` once and caches the answer for the life of the process. */
export function isJavaAvailable(): Promise<boolean> {
  if (!javaAvailability) {
    javaAvailability = (async () => {
      const [javac, java] = await Promise.all([toolAvailable("javac"), toolAvailable("java")]);
      return javac && java;
    })();
  }
  return javaAvailability;
}

type ChildStatus = "ok" | "timeout" | "spawn-error" | "non-zero";

type ChildOutcome = {
  status: ChildStatus;
  stdout: string;
  stderr: string;
  durationMs: number;
};

function runProcess(
  command: string,
  args: string[],
  workDir: string,
  stdin: string,
  timeoutMs: number
): Promise<ChildOutcome> {
  return new Promise((resolve) => {
    const started = Date.now();
    let stdout = "";
    let stderr = "";
    let settled = false;
    let timeoutFired = false;

    const child = spawn(command, args, {
      cwd: workDir,
      windowsHide: true,
      // On POSIX this makes the child a process-group leader so the whole tree
      // can be killed when a solution never terminates.
      detached: process.platform !== "win32",
    });

    const finish = (status: ChildStatus) => {
      if (settled) return;
      settled = true;
      clearTimeout(killTimer);
      resolve({ status, stdout, stderr, durationMs: Date.now() - started });
    };

    const kill = () => {
      if (!child.pid) return child.kill("SIGKILL");
      if (process.platform === "win32") {
        // /T takes down grandchildren too (javac spawns a compiler daemon).
        execFile("taskkill", ["/pid", String(child.pid), "/T", "/F"], () => {});
      } else {
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch {
          // Process already exited.
        }
      }
    };

    child.stdout?.on("data", (chunk: Buffer) => {
      if (stdout.length < MAX_OUTPUT_CHARS) stdout += String(chunk);
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      if (stderr.length < MAX_OUTPUT_CHARS) stderr += String(chunk);
    });
    child.on("error", (error) => {
      stderr = `${stderr}${error.message}`;
      finish("spawn-error");
    });
    child.on("close", (code, signal) => {
      if (code === 0) finish("ok");
      else if (timeoutFired || signal) finish("timeout");
      else finish("non-zero");
    });

    const killTimer = setTimeout(() => {
      timeoutFired = true;
      kill();
      // Wait for the child to actually exit so Windows releases its file
      // handles before we delete the temp dir (otherwise: EBUSY). The 'close'
      // handler normally wins this race; this is only a fallback.
      setTimeout(() => finish("timeout"), 2_000);
    }, timeoutMs);

    child.stdin?.end(stdin);
  });
}

export type JavaRunOutcome = {
  /** Set when the code never made it to the test phase (bad code or no JDK). */
  compileError?: string;
  summary: RunSummary;
  /** True when every test passed and there was no compile error. */
  solved: boolean;
  durationMs: number;
};

/** Windows can hold the temp dir briefly after a kill - retry, then give up quietly. */
async function removeDir(dir: string): Promise<void> {
  const retryable = new Set(["EBUSY", "EPERM", "ENOTEMPTY", "EACCES"]);
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      await rm(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      return;
    } catch (error) {
      if (!retryable.has((error as NodeJS.ErrnoException).code ?? "")) return;
      await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
    }
  }
  console.warn("[java-lab] could not clean up temp dir", dir);
}

function stripPaths(text: string, dir: string, className: string): string {
  const file = join(dir, `${className}.java`);
  return text.split(file).join(`${className}.java`).split(dir).join("");
}

function summariseFailure(outcome: ChildOutcome, dir: string, className: string): string {
  if (outcome.status === "timeout") {
    return `Timed out after ${RUN_TIMEOUT_MS} ms - the program never finished (infinite loop or missing shutdown).`;
  }
  if (outcome.status === "spawn-error") {
    return "Could not start the Java runtime on this machine.";
  }
  const detail = stripPaths(outcome.stderr || outcome.stdout, dir, className).trim();
  const lines = detail.split("\n").slice(0, 6).join("\n").trim();
  return lines || "The program exited with a non-zero status.";
}

/**
 * Compiles `code` with `javac` and runs every test against the produced class,
 * each in a fresh JVM so one test can never poison the next.
 */
export async function executeJavaTests(
  code: string,
  tests: TestCase[],
  difficulty: JavaDifficulty
): Promise<JavaRunOutcome> {
  const started = Date.now();
  const done = (compileError?: string): JavaRunOutcome => ({
    compileError,
    summary: summarize([], difficulty),
    solved: false,
    durationMs: Date.now() - started,
  });

  if (code.length > MAX_CODE_CHARS) {
    return done("Solution is too large - keep it under 100,000 characters.");
  }
  if (!hasMainMethod(code)) {
    return done('Missing a "public static void main(String[] args)" method.');
  }
  const className = extractClassName(code);
  if (!className || !CLASS_NAME_PATTERN.test(className)) {
    return done("No class declaration found - declare one, e.g. `public class Main`.");
  }
  if (tests.length === 0) {
    return done("This problem has no test cases configured.");
  }
  if (tests.length > MAX_TESTS) {
    return done("Too many test cases - the lab runs at most 25 per submission.");
  }

  const available = await isJavaAvailable();
  if (!available) {
    return done(
      "Java is not installed (or javac/java are not on PATH). Install a JDK and restart the dev server."
    );
  }

  const dir = await mkdtemp(join(tmpdir(), "java-lab-"));
  try {
    const source = join(dir, `${className}.java`);
    await writeFile(source, code, "utf8");

    const compile = await runProcess(
      "javac",
      ["-encoding", "UTF-8", "-nowarn", "-d", dir, source],
      dir,
      "",
      COMPILE_TIMEOUT_MS
    );
    if (compile.status !== "ok") {
      const detail = stripPaths(compile.stderr || compile.stdout, dir, className).trim();
      if (compile.status === "timeout") {
        return done(`Compilation timed out after ${COMPILE_TIMEOUT_MS} ms.`);
      }
      return done(detail || "Compilation failed.");
    }

    const results: TestResult[] = [];
    for (const test of tests) {
      const outcome = await runProcess(
        "java",
        ["-XX:+UseSerialGC", "-cp", dir, className],
        dir,
        test.input,
        RUN_TIMEOUT_MS
      );
      const hidden = test.hidden ?? false;
      const failed = outcome.status !== "ok";

      results.push({
        label: test.label,
        passed: !failed && outputsMatch(outcome.stdout, test.expected),
        hidden,
        input: test.input,
        expected: test.expected,
        actual: failed
          ? summariseFailure(outcome, dir, className)
          : stripPaths(outcome.stdout, dir, className),
        ...(failed ? { error: summariseFailure(outcome, dir, className) } : {}),
      });
    }

    const summary = summarize(results, difficulty);
    return {
      summary,
      solved: summary.total > 0 && summary.passed === summary.total,
      durationMs: Date.now() - started,
    };
  } finally {
    await removeDir(dir);
  }
}

