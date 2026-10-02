import { describe, expect, it } from "vitest";

import {
  LAB_BADGES,
  LAB_XP_PER_LEVEL,
  computeLabLevel,
  earnedLabBadgeIds,
  emptyRecord,
  problemXpCeiling,
  solvedCount,
  totalXp,
  type LabBadgeInput,
  type LabProgress,
  type LabRecord,
} from "./progress";

function record(patch: Partial<LabRecord> = {}): LabRecord {
  return { ...emptyRecord(), ...patch };
}

describe("computeLabLevel", () => {
  it("starts at level 1 with no xp", () => {
    const info = computeLabLevel(0);
    expect(info.level).toBe(1);
    expect(info.title).toBe("Newcomer");
    expect(info.intoLevel).toBe(0);
    expect(info.progressPct).toBe(0);
  });

  it("advances a level every LAB_XP_PER_LEVEL xp", () => {
    expect(computeLabLevel(LAB_XP_PER_LEVEL - 1).level).toBe(1);
    expect(computeLabLevel(LAB_XP_PER_LEVEL).level).toBe(2);
    expect(computeLabLevel(LAB_XP_PER_LEVEL * 2).level).toBe(3);
  });

  it("clamps negative xp back to level 1", () => {
    expect(computeLabLevel(-50).level).toBe(1);
    expect(computeLabLevel(-50).intoLevel).toBe(0);
  });

  it("caps the title at the final rank", () => {
    expect(computeLabLevel(LAB_XP_PER_LEVEL * 100).title).toBe("Java Legend");
  });
});

describe("totalXp and solvedCount", () => {
  it("sums xp across every record", () => {
    const progress: LabProgress = { a: record({ xp: 60 }), b: record({ xp: 110 }) };
    expect(totalXp(progress)).toBe(170);
    expect(solvedCount(progress)).toBe(0);
  });

  it("counts only fully solved records", () => {
    const progress: LabProgress = { a: record({ solved: true }), b: record({ best: 60 }) };
    expect(solvedCount(progress)).toBe(1);
  });

  it("is zero for a fresh profile", () => {
    expect(totalXp({})).toBe(0);
    expect(solvedCount({})).toBe(0);
  });
});

describe("problemXpCeiling", () => {
  it("adds the clean-sweep bonus to each difficulty", () => {
    expect(problemXpCeiling({ difficulty: "EASY" })).toBe(80);
    expect(problemXpCeiling({ difficulty: "MEDIUM" })).toBe(130);
    expect(problemXpCeiling({ difficulty: "HARD" })).toBe(200);
  });
});

describe("earnedLabBadgeIds", () => {
  const arrays: LabBadgeInput = { id: "p1", difficulty: "EASY", category: "arrays-hashing" };

  it("grants nothing on a fresh profile", () => {
    expect(earnedLabBadgeIds({}, [])).toEqual([]);
    expect(LAB_BADGES.map((b) => b.id)).toContain("first_solve");
  });

  it("grants First Blood and No Peek on one clean solve", () => {
    const progress: LabProgress = { p1: record({ solved: true }) };
    expect(earnedLabBadgeIds(progress, [arrays])).toEqual(["first_solve", "no_peek"]);
  });

  it("withholds No Peek when the solution was revealed", () => {
    const progress: LabProgress = { p1: record({ solved: true, usedSolution: true }) };
    expect(earnedLabBadgeIds(progress, [arrays])).not.toContain("no_peek");
  });

  it("needs three categories for Explorer and a HARD solve for Hard Hero", () => {
    const problems: LabBadgeInput[] = [
      { id: "p1", difficulty: "EASY", category: "arrays-hashing" },
      { id: "p2", difficulty: "EASY", category: "design" },
      { id: "p3", difficulty: "HARD", category: "dp-graph" },
    ];
    const progress: LabProgress = {
      p1: record({ solved: true, usedSolution: true }),
      p2: record({ solved: true, usedSolution: true }),
      p3: record({ solved: true, usedSolution: true }),
    };
    const earned = earnedLabBadgeIds(progress, problems);
    expect(earned).toContain("explorer");
    expect(earned).toContain("hard_hero");
    expect(earned).not.toContain("no_peek");
  });

  it("keeps Explorer off a single-category profile", () => {
    const problems: LabBadgeInput[] = [
      { id: "p1", difficulty: "EASY", category: "arrays-hashing" },
      { id: "p2", difficulty: "EASY", category: "arrays-hashing" },
      { id: "p3", difficulty: "EASY", category: "arrays-hashing" },
    ];
    const progress: LabProgress = {
      p1: record({ solved: true }),
      p2: record({ solved: true }),
      p3: record({ solved: true }),
    };
    expect(earnedLabBadgeIds(progress, problems)).not.toContain("explorer");
  });

  it("grants Speedrunner below five minutes only", () => {
    const fast: LabProgress = {
      p1: record({ solved: true, bestDurationMs: 120_000 }),
    };
    const slow: LabProgress = {
      p1: record({ solved: true, bestDurationMs: 600_000 }),
    };
    expect(earnedLabBadgeIds(fast, [arrays])).toContain("speedrunner");
    expect(earnedLabBadgeIds(slow, [arrays])).not.toContain("speedrunner");
  });

  it("unlocks Getting Sharp at five solves and Grinder at ten", () => {
    const problems: LabBadgeInput[] = Array.from({ length: 10 }, (_, index) => ({
      id: `p${index}`,
      difficulty: "EASY" as const,
      category: "arrays-hashing" as const,
    }));
    const all = Object.fromEntries(
      problems.map((problem) => [problem.id, record({ solved: true, usedSolution: true })])
    );

    const firstFive = Object.fromEntries(
      problems.slice(0, 5).map((problem) => [problem.id, all[problem.id]])
    );
    expect(earnedLabBadgeIds(firstFive, problems)).toContain("five_solves");
    expect(earnedLabBadgeIds(firstFive, problems)).not.toContain("ten_solves");
    expect(earnedLabBadgeIds(all, problems)).toContain("ten_solves");
  });

  it("grants Persistent at 25 run attempts", () => {
    expect(earnedLabBadgeIds({ p1: record({ attempts: 24 }) }, [arrays])).not.toContain(
      "persistent"
    );
    expect(earnedLabBadgeIds({ p1: record({ attempts: 25 }) }, [arrays])).toContain("persistent");
  });
});
