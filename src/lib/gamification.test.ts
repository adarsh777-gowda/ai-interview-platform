import { describe, expect, it } from "vitest";
import {
  badgeById,
  computeLevel,
  computeStreak,
  countWords,
  buildSessionStats,
  earnedBadgeIds,
  turnXpFromScores,
  wordBonusXp,
  xpFromTurns,
} from "./gamification";
import { analyseAnswerStructure, hintsFor } from "./answer-coach";

describe("countWords", () => {
  it("counts words and ignores extra whitespace", () => {
    expect(countWords("  hello   world  ")).toBe(2);
    expect(countWords("")).toBe(0);
  });
});

describe("turnXpFromScores", () => {
  it("scales the rubric total", () => {
    expect(turnXpFromScores({ clarity: 5, structure: 5, correctness: 5, depth: 5 })).toBe(200);
    expect(turnXpFromScores(null)).toBe(0);
  });
});

describe("wordBonusXp", () => {
  it("rewards longer answers", () => {
    expect(wordBonusXp(10)).toBe(0);
    expect(wordBonusXp(80)).toBeGreaterThan(0);
  });
});

describe("xpFromTurns", () => {
  it("sums per-turn xp including word bonus", () => {
    const xp = xpFromTurns([
      { scoresJson: { clarity: 5, structure: 5, correctness: 5, depth: 5 }, userAnswer: "short" },
    ]);
    expect(xp).toBe(200);
  });
});

describe("computeLevel", () => {
  it("starts at level 1 with zero xp", () => {
    const info = computeLevel(0);
    expect(info.level).toBe(1);
    expect(info.progressPct).toBe(0);
  });

  it("advances a level every 250 xp", () => {
    expect(computeLevel(249).level).toBe(1);
    expect(computeLevel(250).level).toBe(2);
    expect(computeLevel(500).level).toBe(3);
  });
});

describe("computeStreak", () => {
  it("counts trailing good turns only", () => {
    expect(computeStreak([2, 4, 4, 4])).toBe(3);
    expect(computeStreak([4, 2, 4])).toBe(1);
    expect(computeStreak([])).toBe(0);
  });
});

describe("buildSessionStats", () => {
  it("uses the supplied unique answered count when turns repeat a question", () => {
    const turn = { scoresJson: null, userAnswer: "answer", topic: "javascript" };
    const stats = buildSessionStats([turn, turn], 3, 1);

    expect(stats.answeredCount).toBe(1);
    expect(stats.averages).toHaveLength(2);
  });
});

describe("earnedBadgeIds", () => {
  it("awards first answer and streak badges", () => {
    const ids = earnedBadgeIds({
      answeredCount: 3,
      totalQuestions: 5,
      averages: [4, 4, 4],
      topics: ["javascript", "arrays", "trees"],
      maxDepth: 4.6,
      maxWords: 160,
      perfectCount: 0,
    });
    expect(ids).toContain("first_answer");
    expect(ids).toContain("streak3");
    expect(ids).toContain("explorer");
    expect(ids).toContain("deep");
    expect(ids).toContain("wordsmith");
    expect(ids).not.toContain("completionist");
  });

  it("awards completionist when all questions are answered", () => {
    const ids = earnedBadgeIds({
      answeredCount: 5,
      totalQuestions: 5,
      averages: [3, 3],
      topics: ["javascript"],
      maxDepth: 3,
      maxWords: 20,
      perfectCount: 0,
    });
    expect(ids).toContain("completionist");
  });

  it("resolves a badge definition by id", () => {
    expect(badgeById("perfect")?.label).toBe("Perfectionist");
    expect(badgeById("nope")).toBeUndefined();
  });
});

describe("analyseAnswerStructure", () => {
  it("detects STAR elements in a behavioral answer", () => {
    const analysis = analyseAnswerStructure(
      "BEHAVIORAL",
      "In my last project the situation was a tight deadline. My task was to ship it. I led the team and the result reduced bugs by 30%."
    );
    expect(analysis.label).toBe("STAR method");
    expect(analysis.matched).toBe(analysis.total);
  });

  it("falls back to technical structure for unknown types", () => {
    const analysis = analyseAnswerStructure("UNKNOWN", "");
    expect(analysis.total).toBeGreaterThan(0);
    expect(analysis.matched).toBe(0);
  });
});

describe("hintsFor", () => {
  it("returns hints per type with a fallback", () => {
    expect(hintsFor("CODING").length).toBeGreaterThan(0);
    expect(hintsFor("mystery").length).toBeGreaterThan(0);
  });
});
