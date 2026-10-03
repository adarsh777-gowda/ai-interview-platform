import { describe, expect, it } from "vitest";

import { analyseSpokenEnglish, bandFor, tokenize } from "./analysis";

/** 30 seconds of speech. */
const THIRTY_SECONDS = 30_000;

const STRONG_ANSWER =
  "At the time I was working on the payments service and the team was losing data on retries. " +
  "My responsibility was the idempotency layer. I decided to introduce a deduplication key stored " +
  "in Redis, and I implemented it behind a feature flag so we could roll back safely. " +
  "As a result we reduced duplicate charges by ninety four percent within a fortnight, and the " +
  "on call alerts dropped noticeably because the runbook no longer needed the manual replay step.";

describe("tokenize", () => {
  it("lowercases and strips punctuation", () => {
    expect(tokenize("Hello, world! It's fine.")).toEqual(["hello", "world", "it's", "fine"]);
  });

  it("drops recogniser noise markers", () => {
    expect(tokenize("[silence] hello [inaudible]")).toEqual(["hello"]);
  });

  it("returns an empty list for empty input", () => {
    expect(tokenize("")).toEqual([]);
  });
});

describe("bandFor", () => {
  it("maps scores to bands", () => {
    expect(bandFor(85)).toBe("confident");
    expect(bandFor(65)).toBe("solid");
    expect(bandFor(45)).toBe("developing");
    expect(bandFor(10)).toBe("needs-work");
  });
});

describe("analyseSpokenEnglish - robustness", () => {
  it("handles an empty transcript without throwing", () => {
    const report = analyseSpokenEnglish({ text: "", durationMs: 0 });
    expect(report.wordCount).toBe(0);
    expect(report.score).toBe(0);
    expect(report.tooShort).toBe(true);
    expect(report.wordsPerMinute).toBeNull();
  });

  it("flags very short answers as unscorable", () => {
    const report = analyseSpokenEnglish({ text: "Um, I guess, yeah.", durationMs: 4000 });
    expect(report.tooShort).toBe(true);
    expect(report.score).toBe(0);
    expect(report.improvements[0]).toContain("too short");
  });

  it("works without timing and still produces a score", () => {
    const report = analyseSpokenEnglish({ text: STRONG_ANSWER });
    expect(report.wordsPerMinute).toBeNull();
    expect(report.parts.pace).toBeNull();
    // Pace weight must be redistributed, not scored as zero.
    expect(report.score).toBeGreaterThan(60);
  });

  it("survives a transcript with no sentence punctuation", () => {
    const report = analyseSpokenEnglish({
      text: "we shipped the service last quarter with fewer incidents",
      durationMs: 20000,
    });
    expect(report.sentenceCount).toBe(1);
    expect(Number.isFinite(report.score)).toBe(true);
  });

  it("treats a zero duration as unknown rather than infinite speed", () => {
    const report = analyseSpokenEnglish({ text: STRONG_ANSWER, durationMs: 0 });
    expect(report.wordsPerMinute).toBeNull();
  });
});

describe("analyseSpokenEnglish - fillers", () => {
  it("counts hard fillers fully and soft fillers as a half", () => {
    const report = analyseSpokenEnglish({
      text: "um so um we just basically shipped it",
      durationMs: 20000,
    });
    // "um" x2 = 2.0, "just" = 0.5, "basically" = 0.5
    expect(report.fillerCount).toBe(3);
  });

  it("does not double count a masked phrase", () => {
    const report = analyseSpokenEnglish({
      text: "you know you know we shipped",
      durationMs: 20000,
    });
    expect(report.fillerCount).toBe(2);
  });

  it("does not match fillers inside longer words", () => {
    // "umbrella" contains "um" but is not a filler.
    const report = analyseSpokenEnglish({
      text: "the umbrella factory summarised aluminium analysis",
      durationMs: 20000,
    });
describe("analyseSpokenEnglish - pace", () => {
  it("gives full marks inside the natural range", () => {
    // 75 words over 30s = 150 wpm.
    const text = Array.from({ length: 75 }, (_, i) => `word${i}`).join(" ");
    const report = analyseSpokenEnglish({ text, durationMs: THIRTY_SECONDS });
    expect(report.wordsPerMinute).toBe(150);
    expect(report.parts.pace).toBe(100);
  });

  it("penalises rushing and dragging", () => {
    const text = Array.from({ length: 75 }, (_, i) => `word${i}`).join(" ");
    const fast = analyseSpokenEnglish({ text, durationMs: 15000 }); // 300 wpm
    const slow = analyseSpokenEnglish({ text, durationMs: 90000 }); // 50 wpm
    expect(fast.parts.pace).toBeLessThan(100);
    expect(slow.parts.pace).toBeLessThan(100);
  });

  it("advises slowing down when speaking too fast", () => {
    const text = Array.from({ length: 90 }, (_, i) => `word${i}`).join(" ");
    const report = analyseSpokenEnglish({ text, durationMs: 20000 }); // 270 wpm
    expect(report.improvements.join(" ")).toContain("fast");
  });
});

describe("analyseSpokenEnglish - STAR structure", () => {
  it("detects a full STAR answer", () => {
    const report = analyseSpokenEnglish({ text: STRONG_ANSWER, durationMs: THIRTY_SECONDS });
    expect(report.starScore).toBe(4);
  });

  it("flags an answer with no result", () => {
    const report = analyseSpokenEnglish({
      text: "At the time the team was facing a problem and my responsibility was testing. I decided to write a script and I implemented it that week.",
      durationMs: THIRTY_SECONDS,
    });
    expect(report.star.result).toBe(0);
    expect(report.improvements.join(" ")).toContain("result");
  });

  it("rewards structured answers over unstructured ones", () => {
    const structured = analyseSpokenEnglish({ text: STRONG_ANSWER, durationMs: THIRTY_SECONDS });
    const unstructured = analyseSpokenEnglish({
      text: "we did stuff with the service and it was fine and people were happy and then we shipped it and everything worked out well",
      durationMs: THIRTY_SECONDS,
    });
    expect(structured.parts.structure).toBeGreaterThan(unstructured.parts.structure);
  });
});

describe("analyseSpokenEnglish - hedging and ownership", () => {
  it("counts hedges and ownership markers", () => {
    const report = analyseSpokenEnglish({
      text: "I guess maybe i think i led the project and i decided to rebuild it and as a result it worked",
      durationMs: THIRTY_SECONDS,
    });
    expect(report.hedgeCount).toBeGreaterThanOrEqual(3);
    expect(report.ownershipCount).toBeGreaterThanOrEqual(2);
  });

  it("penalises hedging in the language score", () => {
    const confident = analyseSpokenEnglish({ text: STRONG_ANSWER, durationMs: THIRTY_SECONDS });
    const hesitant = analyseSpokenEnglish({
      text: "i guess i think maybe i probably led it and i suppose i decided to build something and as a result it worked",
      durationMs: THIRTY_SECONDS,
    });
    expect(confident.parts.language).toBeGreaterThan(hesitant.parts.language);
  });
});

describe("analyseSpokenEnglish - output shape", () => {
  it("keeps the score within 0-100 and reports strengths and tips", () => {
    const report = analyseSpokenEnglish({ text: STRONG_ANSWER, durationMs: THIRTY_SECONDS });
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
    expect(report.strengths.length).toBeGreaterThan(0);
    expect(Array.isArray(report.improvements)).toBe(true);
  });

  it("is deterministic for the same input", () => {
    const a = analyseSpokenEnglish({ text: STRONG_ANSWER, durationMs: THIRTY_SECONDS });
    const b = analyseSpokenEnglish({ text: STRONG_ANSWER, durationMs: THIRTY_SECONDS });
    expect(a).toEqual(b);
  });
});
    expect(report.fillerCount).toBe(0);
  });

  it("scores a clean answer above a filler-heavy one", () => {
    const clean = analyseSpokenEnglish({ text: STRONG_ANSWER, durationMs: THIRTY_SECONDS });
    const messy = analyseSpokenEnglish({
      text: "um so like i um i mean i guess we um basically just shipped you know the thing i think",
      durationMs: THIRTY_SECONDS,
    });
    expect(clean.parts.fluency).toBeGreaterThan(messy.parts.fluency);
  });
});