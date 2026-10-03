// Vocabulary used to score spoken English.
//
// Everything here runs in the browser on the transcript text, so the feature
// costs nothing: no model call, no third-party speech service. Word lists are
// intentionally small and high-signal - a long list of near-synonyms produces
// noisy scores that users cannot act on.

/** Filler sounds and filler phrases. Matched on whole words. */
export const FILLERS = [
  "um",
  "uh",
  "erm",
  "ah",
  "eh",
  "hmm",
  "like",
  "you know",
  "i mean",
  "sort of",
  "kind of",
  "basically",
  "literally",
  "actually",
  "just",
  "really",
  "very",
] as const;

/**
 * Filler-ish words that are only fillers when they are not doing real work.
 * A long answer legitimately uses "just" and "very"; we damp these rather than
 * counting them, so they inform but never dominate the score.
 */
export const SOFT_FILLERS: ReadonlySet<string> = new Set([
  "just",
  "really",
  "very",
  "actually",
  "like",
  "basically",
  "literally",
]);

/** Hedging weakens an answer even when the content is correct. */
export const HEDGES = [
  "i think",
  "i guess",
  "i suppose",
  "maybe",
  "perhaps",
  "probably",
  "possibly",
  "i believe",
  "sort of",
  "kind of",
  "more or less",
  "not really",
  "it seems",
] as const;

/** Active-voice ownership markers, the opposite of hedging. */
export const OWNERSHIP_MARKERS = [
  "i led",
  "i built",
  "i designed",
  "i implemented",
  "i created",
  "i owned",
  "i decided",
  "i drove",
  "i shipped",
  "i launched",
  "i refactored",
  "i introduced",
  "i took",
  "i ran",
  "i wrote",
  "i solved",
  "i handled",
  "i delivered",
  "i set up",
] as const;

/** Discouraged weak openings that undercut the answer immediately. */
export const WEAK_OPENERS = [
  "i don't know",
  "i dont know",
  "i am not sure",
  "i'm not sure",
  "i guess",
  "um",
  "uh",
  "well",
  "so yeah",
  "it was like",
] as const;

/**
 * Cues for the STAR shape interviewers actually listen for. Used to give
 * structural advice on spoken answers, not to grade content.
 */
export const STAR_CUES = {
  situation: [
    "at the time",
    "the situation",
    "we were",
    "i was working",
    "the company",
    "the team",
    "when i joined",
    "the project",
    "my role",
  ],
  task: [
    "i was responsible",
    "my responsibility",
    "i had to",
    "my task",
    "i was asked",
    "the goal was",
    "we needed to",
    "the objective",
  ],
  action: [
    "i decided",
    "i proposed",
    "i implemented",
    "i started",
    "i built",
    "i scheduled",
    "i introduced",
    "i reached out",
    "i wrote",
    "i delegated",
  ],
  result: [
    "as a result",
    "which resulted",
    "the outcome",
    "we ended up",
    "it reduced",
    "it improved",
    "eventually",
    "after that",
    "the result was",
    "ended up",
  ],
} as const;

/** Transcript noise the recogniser emits that is not part of the answer. */
export const TRANSCRIPT_NOISE: ReadonlySet<string> = new Set([
  "[silence]",
  "(silence)",
  "silence",
  "[inaudible]",
  "(inaudible)",
  "[no speech]",
  "[noise]",
  ".",
  "",
]);