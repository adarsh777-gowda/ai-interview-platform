// Live "while you answer" coaching: structure detection and hints per question type.
// Pure functions, no external services.

export type StructureStep = { key: string; label: string; keywords: string[] };
export type AnswerStructure = { label: string; steps: StructureStep[] };

export const ANSWER_STRUCTURES: Record<string, AnswerStructure> = {
  BEHAVIORAL: {
    label: "STAR method",
    steps: [
      { key: "situation", label: "Situation", keywords: ["situation", "context", "when", "project", "team", "at my"] },
      { key: "task", label: "Task", keywords: ["task", "goal", "responsib", "objective", "needed to", "asked to"] },
      { key: "action", label: "Action", keywords: ["i did", "i led", "i built", "i implemented", "i decided", "action", "so i"] },
      { key: "result", label: "Result", keywords: ["result", "impact", "outcome", "reduced", "improved", "increased", "%", "led to"] },
    ],
  },
  TECHNICAL: {
    label: "Define → Explain → Example → Tradeoffs",
    steps: [
      { key: "concept", label: "Define the concept", keywords: [" is ", " means ", "refers to", "definition", "essentially"] },
      { key: "how", label: "Explain how it works", keywords: ["because", "works", "process", "first", "then", "occurs", "steps"] },
      { key: "example", label: "Give a concrete example", keywords: ["for example", "e.g", "such as", "instance", "like when"] },
      { key: "tradeoffs", label: "Mention tradeoffs", keywords: ["however", "trade", "downside", "but ", "edge case", "limitation"] },
    ],
  },
  CODING: {
    label: "Approach → Complexity → Edge cases",
    steps: [
      { key: "approach", label: "Describe the approach", keywords: ["approach", "iterate", "hash", "sort", "pointer", "recursion", "loop", "map"] },
      { key: "complexity", label: "State time/space complexity", keywords: ["o(", "complexity", "time", "space", "linear", "n log n", "constant"] },
      { key: "edge", label: "Cover edge cases", keywords: ["edge", "empty", "null", "duplicate", "overflow", "boundary", "negative"] },
    ],
  },
  SYSTEM_DESIGN: {
    label: "Requirements → Components → Scale",
    steps: [
      { key: "requirements", label: "Clarify requirements", keywords: ["requirement", "assume", "qps", "users", "read", "write", "scale of"] },
      { key: "components", label: "Name the components", keywords: ["service", "database", "cache", "queue", "load balancer", "api", "cdn"] },
      { key: "scale", label: "Discuss scaling & tradeoffs", keywords: ["shard", "replicat", "partition", "cache", "tradeoff", "latency", "consistency"] },
    ],
  },
};

export const HINTS: Record<string, string[]> = {
  BEHAVIORAL: [
    "Use STAR: Situation, Task, Action, Result.",
    "Be specific — name the project and your personal contribution.",
    "End with a measurable result or clear lesson learned.",
  ],
  TECHNICAL: [
    "Start with a one-sentence definition.",
    "Explain the mechanism step by step.",
    "Give an example and mention tradeoffs or edge cases.",
  ],
  CODING: [
    "State your approach before code.",
    "Analyze time and space complexity.",
    "Mention edge cases (empty, duplicates, overflow).",
  ],
  SYSTEM_DESIGN: [
    "Clarify requirements and scale first.",
    "List the core components and data flow.",
    "Discuss bottlenecks, caching, and tradeoffs.",
  ],
};

export type StructureAnalysis = {
  label: string;
  steps: Array<StructureStep & { met: boolean }>;
  matched: number;
  total: number;
};

export function analyseAnswerStructure(questionType: string, text: string): StructureAnalysis {
  const structure = ANSWER_STRUCTURES[questionType] ?? ANSWER_STRUCTURES.TECHNICAL;
  const haystack = text.toLowerCase();
  const steps = structure.steps.map((step) => ({
    ...step,
    met: step.keywords.some((keyword) => haystack.includes(keyword)),
  }));
  const matched = steps.filter((step) => step.met).length;
  return { label: structure.label, steps, matched, total: steps.length };
}

export function hintsFor(questionType: string): string[] {
  return HINTS[questionType] ?? HINTS.TECHNICAL;
}
