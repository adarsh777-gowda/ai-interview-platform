import type { JavaProblem } from "./types";
import { JAVA_CATEGORY_LABELS } from "./types";

import { ARRAYS_HASHING_PROBLEMS } from "./bank/arrays-hashing";
import { STRINGS_WINDOW_PROBLEMS } from "./bank/strings-window";
import { STACKS_HEAPS_PROBLEMS } from "./bank/stacks-heaps";
import { DP_GRAPH_PROBLEMS } from "./bank/dp-graph";
import { DESIGN_PROBLEMS } from "./bank/design";
import { STREAMS_CONCURRENCY_PROBLEMS } from "./bank/streams-concurrency";

// Every problem in the lab, grouped by category. Kept as plain data so adding a
// problem (or a whole category) never requires touching UI or API code.
export const JAVA_PROBLEMS: JavaProblem[] = [
  ...ARRAYS_HASHING_PROBLEMS,
  ...STRINGS_WINDOW_PROBLEMS,
  ...STACKS_HEAPS_PROBLEMS,
  ...DP_GRAPH_PROBLEMS,
  ...DESIGN_PROBLEMS,
  ...STREAMS_CONCURRENCY_PROBLEMS,
];

/**
 * Everything that is safe to ship to the browser: hidden tests and the
 * editorial are stripped so they cannot be read out of the page source.
 * The editorial is fetched from /api/java/solution instead.
 */
export type ClientJavaProblem = Omit<JavaProblem, "hiddenTests" | "editorial"> & {
  /** How many hidden tests will run (reveals nothing about their contents). */
  hiddenTestCount: number;
};

export function toClientProblem(problem: JavaProblem): ClientJavaProblem {
  const { hiddenTests: _hiddenTests, editorial: _editorial, ...safe } = problem;
  return { ...safe, hiddenTestCount: problem.hiddenTests.length };
}

/** All tests for a problem: visible examples first, then hidden ones. */
export function allTestsFor(problem: JavaProblem): JavaProblem["examples"] {
  return [...problem.examples, ...problem.hiddenTests];
}

export function findProblem(id: string): JavaProblem | undefined {
  return JAVA_PROBLEMS.find((problem) => problem.id === id);
}

export function problemsInCategory(category: JavaProblem["category"]): JavaProblem[] {
  return JAVA_PROBLEMS.filter((problem) => problem.category === category);
}

export type JavaCategorySummary = {
  id: JavaProblem["category"];
  label: string;
  problems: ClientJavaProblem[];
};

/** Categories in the order they first appear, each with client-safe problems. */
export function categorySummaries(): JavaCategorySummary[] {
  const ids = Array.from(new Set(JAVA_PROBLEMS.map((problem) => problem.category)));
  return ids.map((id) => ({
    id,
    label: JAVA_CATEGORY_LABELS[id],
    problems: problemsInCategory(id).map(toClientProblem),
  }));
}

export function clientProblems(): ClientJavaProblem[] {
  return JAVA_PROBLEMS.map(toClientProblem);
}
