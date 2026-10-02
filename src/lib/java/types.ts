import type { JavaDifficulty, TestCase } from "./runner";

export type JavaCategory =
  | "arrays-hashing"
  | "strings-window"
  | "stacks-heaps"
  | "dp-graph"
  | "design"
  | "streams-concurrency";

export const JAVA_CATEGORY_LABELS: Record<JavaCategory, string> = {
  "arrays-hashing": "Arrays & Hashing",
  "strings-window": "Strings, Two Pointers & Sliding Window",
  "stacks-heaps": "Stacks, Heaps & Binary Search",
  "dp-graph": "DP, Recursion & Graphs",
  design: "OOP & System Design",
  "streams-concurrency": "Streams & Concurrency",
};

export type JavaProblem = {
  id: string;
  title: string;
  category: JavaCategory;
  difficulty: JavaDifficulty;
  /** Companies currently (2025-26) asking this pattern in Java screens. */
  companies: string[];
  tags: string[];
  prompt: string;
  /** How to think about the problem before writing code. */
  approach: string[];
  /** Signals to notice in the statement / interviewer cues. */
  keyElements: string[];
  /** Common mistakes that fail hidden tests. */
  pitfalls: string[];
  examples: TestCase[];
  hiddenTests: TestCase[];
  starterCode: string;
  editorial: string;
  followUps: string[];
};
