/**
 * Choosing which questions a session shows.
 *
 * Kept as pure functions (no Prisma import) so the selection rules are unit
 * testable and can be reused by both the session page and any future entry point.
 */

export type SessionLevel = "JUNIOR" | "MID" | "SENIOR";

export type SelectableQuestion = {
  id: string;
  topic: string;
  difficulty: SessionLevel;
  type: string;
};

/**
 * A session is capped at this many questions so a run stays finishable in one
 * sitting while still giving enough breadth for badges and streak maths.
 */
export const SESSION_QUESTION_LIMIT = 10;

/**
 * How well a question matches the requested session, best (lowest) tier first.
 *
 * The level is a *preference*, never a hard filter. Filtering strictly on
 * topic + level returns almost nothing: a JUNIOR session on `react` has exactly
 * one JUNIOR react prompt in the bank, so the player used to land on a session
 * with no question at all.
 */
function matchTier(
  question: Pick<SelectableQuestion, "topic" | "difficulty">,
  topics: string[],
  level: SessionLevel
): number {
  const topicMatches = topics.includes(question.topic);
  const levelMatches = question.difficulty === level;
  if (topicMatches && levelMatches) return 0;
  if (topicMatches) return 1;
  if (levelMatches) return 2;
  return 3;
}

/** Round-robins across topics so a multi-topic session does not burn topic 1 first. */
function interleaveByTopic<T extends { topic: string }>(questions: T[]): T[] {
  const buckets = new Map<string, T[]>();
  for (const question of questions) {
    const bucket = buckets.get(question.topic);
    if (bucket) bucket.push(question);
    else buckets.set(question.topic, [question]);
  }

  const ordered: T[] = [];
  let remaining = true;
  while (remaining) {
    remaining = false;
    for (const bucket of buckets.values()) {
      const next = bucket.shift();
      if (next) {
        ordered.push(next);
        remaining = true;
      }
    }
  }
  return ordered;
}

export type PickSessionOptions = {
  topics: string[];
  level: SessionLevel;
  limit?: number;
};

/**
 * Ranks `pool` by how well it matches the session and returns up to `limit`
 * questions, interleaved across the chosen topics.
 *
 * Generic so the full question row (including its `prompt`) survives selection.
 * Higher tiers only fill the gaps left by better matches, so a session with a
 * rich exact match is never diluted by off-topic filler.
 */
export function pickSessionQuestions<T extends SelectableQuestion>(
  pool: T[],
  { topics, level, limit = SESSION_QUESTION_LIMIT }: PickSessionOptions
): T[] {
  if (pool.length === 0) return [];

  const ranked = pool
    .map((question, index) => ({ question, index, tier: matchTier(question, topics, level) }))
    .sort((a, b) => a.tier - b.tier || a.index - b.index);

  return interleaveByTopic(ranked.slice(0, limit).map((entry) => entry.question));
}