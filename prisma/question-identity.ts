// Pure helpers shared by `seed.ts`.
//
// The seed identifies a question by a hash of its content rather than by its
// position in the bank, so reordering QUESTION_BANK never rewrites ids. The
// flip side is that switching id schemes (or editing a prompt) leaves the old row
// behind. `planSuperseded` works out how to collapse those duplicates while
// keeping every InterviewTurn, which is onDelete:Cascade from Question.

import { createHash } from "node:crypto";

export type QuestionIdentity = {
  id: string;
  topic: string;
  type: string;
  difficulty: string;
  prompt: string;
};

/**
 * Identity of a question by *what it says*, not where it sits in the file.
 * Deliberately excludes the id so two rows with identical content collide here.
 */
export function contentKey(question: Omit<QuestionIdentity, "id">): string {
  return JSON.stringify([
    question.topic,
    question.type,
    question.difficulty,
    question.prompt,
  ]);
}

/** Stable `seed-<sha256>` id for a bank question. */
export function seedId(question: Omit<QuestionIdentity, "id">): string {
  const digest = createHash("sha256").update(contentKey(question)).digest("hex");
  return `seed-${digest}`;
}

export type SupersedePlan = {
  /** Legacy id -> canonical id. Turns must be moved before the old row is deleted. */
  repoint: { from: string; to: string }[];
  /** Legacy ids that are safe to delete once their turns have been repointed. */
  remove: string[];
};

/**
 * Finds rows that are duplicates of a canonical bank question under a stale id.
 *
 * A group of identical questions is only collapsed when one member is a current
 * bank id. If none is, the prompt itself was edited, and the old row is a
 * genuinely different historical question whose turns we must not touch.
 */
export function planSuperseded(
  rows: QuestionIdentity[],
  canonicalIds: ReadonlySet<string>
): SupersedePlan {
  const groups = new Map<string, QuestionIdentity[]>();
  for (const row of rows) {
    const key = contentKey(row);
    const bucket = groups.get(key);
    if (bucket) bucket.push(row);
    else groups.set(key, [row]);
  }

  const repoint: { from: string; to: string }[] = [];
  const remove: string[] = [];

  for (const bucket of groups.values()) {
    if (bucket.length < 2) continue;

    const canonical = bucket.find((row) => canonicalIds.has(row.id));
    if (!canonical) continue;

    for (const row of bucket) {
      if (row.id === canonical.id) continue;
      repoint.push({ from: row.id, to: canonical.id });
      remove.push(row.id);
    }
  }

  return { repoint, remove };
}