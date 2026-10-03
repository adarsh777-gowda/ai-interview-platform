// Scores spoken English from a transcript, entirely in the browser.
//
// No model call and no third-party speech service: this is deterministic text
// and timing analysis, which is what keeps the voice interview free to run. The
// same input always produces the same report, so every rule is unit testable.

import {
  FILLERS,
  HEDGES,
  OWNERSHIP_MARKERS,
  SOFT_FILLERS,
  STAR_CUES,
  TRANSCRIPT_NOISE,
  WEAK_OPENERS,
} from "./lexicon";

export type SpokenSample = {
  /** The recogniser's transcript for the whole answer. */
  text: string;
  /** Wall-clock length of the answer in ms. Omit when unknown. */
  durationMs?: number;
};

export type CommunicationBand = "needs-work" | "developing" | "solid" | "confident";

export type CommunicationReport = {
  /** 0-100 composite. */
  score: number;
  band: CommunicationBand;
  /** True when there is too little speech to say anything meaningful. */
  tooShort: boolean;
  wordCount: number;
  wordsPerMinute: number | null;
  fillerCount: number;
  fillersPer100Words: number;
  sentenceCount: number;
  avgSentenceWords: number;
  /** 0 when every sentence is the same length (robotic delivery). */
  sentenceVariety: number;
  typeTokenRatio: number;
  longWordRatio: number;
  hedgeCount: number;
  ownershipCount: number;
  star: { situation: number; task: number; action: number; result: number };
  /** 0-4: how much of STAR the answer actually covered. */
  starScore: number;
  strengths: string[];
  improvements: string[];
  /** Component scores, exposed so the UI can show why the total is what it is. */
  parts: { pace: number | null; fluency: number; structure: number; language: number };
};

/** Comfortable adult presentation pace. */
const IDEAL_WPM = { min: 130, max: 170 };
/** Below this many words we refuse to score confidently. */
const MIN_WORDS_FOR_SCORE = 25;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Counts whole-word / whole-phrase occurrences and blanks them out so a later
 * pass cannot count them again. Masking prevents "you know" from also scoring
 * as "know" and "sort of" from double counting "of".
 */
function countPhrases(
  text: string,
  phrases: readonly string[]
): { count: number; masked: string } {
  let masked = ` ${text.toLowerCase()} `;
  let count = 0;

  for (const phrase of phrases) {
    const pattern = new RegExp(`(^|[^a-z'])${escapeRegExp(phrase)}(?![a-z'])`, "g");
    masked = masked.replace(pattern, (_match, before: string) => {
      count += 1;
      return `${before} `;
    });
  }

  return { count, masked };
}

export function tokenize(text: string): string[] {
  // Strip recogniser noise markers before tokenising: they are bracketed, so a
  // plain word tokenizer would otherwise turn "[silence]" into the word "silence".
  const cleaned = text.replace(/[[(]\s*(silence|inaudible|noise|no speech|inaudible)[\])]/gi, " ");
  return (cleaned.toLowerCase().match(/[a-z']+/g) ?? []).filter(
    (token) => token.length > 0 && !TRANSCRIPT_NOISE.has(token)
  );
}

function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+(?:\s+|$)/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  const sq = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(sq);
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function bandFor(score: number): CommunicationBand {
  if (score >= 80) return "confident";
  if (score >= 60) return "solid";
  if (score >= 40) return "developing";
  return "needs-work";
}

function paceScore(wpm: number | null): number | null {
  if (wpm === null || !Number.isFinite(wpm) || wpm <= 0) return null;
  if (wpm >= IDEAL_WPM.min && wpm <= IDEAL_WPM.max) return 100;
  // Outside the band, lose points proportionally to distance from it.
  const distance = wpm < IDEAL_WPM.min ? IDEAL_WPM.min - wpm : wpm - IDEAL_WPM.max;
  return clamp(100 - distance * 1.4);
}

function starCoverage(text: string) {
  const lower = ` ${text.toLowerCase()} `;
  const count = (cues: readonly string[]) =>
    cues.filter((cue) => lower.includes(cue)).length;

  const situation = count(STAR_CUES.situation);
  const task = count(STAR_CUES.task);
  const action = count(STAR_CUES.action);
  const result = count(STAR_CUES.result);

  return {
    situation,
    task,
    action,
    result,
    // 1 point per STAR element that appeared at least once.
    starScore: [situation, task, action, result].filter((value) => value > 0).length,
  };
}
type Signals = {
  fluency: number;
  fillersPer100Words: number;
  structure: number;
  star: { situation: number; task: number; action: number; result: number };
  starScore: number;
  wordsPerMinute: number | null;
  ownershipCount: number;
  hedgeCount: number;
  language: number;
  tooShort?: boolean;
  weakOpenerCount?: number;
  avgSentenceWords?: number;
  sentenceLengths?: number;
};

function collectStrengths(s: Signals): string[] {
  const strengths: string[] = [];
  if (s.fillersPer100Words <= 3) strengths.push("Very few filler words — that is a strong habit to keep.");
  if (s.starScore >= 3) strengths.push("Your answer walked a recognisable STAR arc, so it was easy to follow.");
  if (s.wordsPerMinute !== null && s.wordsPerMinute >= 130 && s.wordsPerMinute <= 170) {
    strengths.push(`Pace of ${s.wordsPerMinute} words/min sits in the natural presenting range.`);
  }
  if (s.ownershipCount >= 2) strengths.push("You spoke in the active voice and claimed your own work.");
  if (s.language >= 70) strengths.push("Vocabulary was varied and precise.");
  return strengths.slice(0, 4);
}

function collectImprovements(s: Signals): string[] {
  const tips: string[] = [];

  if (s.tooShort) {
    return ["Answer too short to score reliably — aim for at least 25 spoken words."];
  }

  if (s.wordsPerMinute !== null && s.wordsPerMinute > 190) {
    tips.push("You are speaking very fast. Pausing after each point makes you sound more considered.");
  } else if (s.wordsPerMinute !== null && s.wordsPerMinute < 110 && s.wordsPerMinute > 0) {
    tips.push("Your pace is slow. Long pauses read as uncertainty, so keep the answer moving.");
  }

  if (s.fillersPer100Words > 8) {
    tips.push("Filler words are frequent. Replace each one with a short, deliberate pause instead.");
  }

  if (s.starScore <= 1) {
    tips.push("Give a concrete situation first, then your task, what you did, and the measurable result.");
  } else if (s.starScore <= 2) {
    tips.push("You cover the story but skip part of STAR — name the outcome and its number explicitly.");
  }

  if (s.star.result === 0) {
    tips.push("No result was mentioned. Finish every answer with what changed and by how much.");
  }

  if (s.hedgeCount >= 3) {
    tips.push("You hedge often. State what you did directly instead of softening it.");
  }
  if (s.ownershipCount === 0) {
    tips.push("Use \"I\" and name the specific action you took rather than describing the team in general.");
  }
  if ((s.weakOpenerCount ?? 0) > 0) {
    tips.push("Drop apologetic openers like \"um\" or \"I guess\" — open with the point instead.");
  }
  if ((s.avgSentenceWords ?? 0) > 32) {
    tips.push("Your sentences run long. Break them up so the listener can follow the structure.");
  }

  return tips.slice(0, 5);
}

/**
 * Builds the composite report for one spoken answer.
 *
 * Component weights: pace 25, fluency 30, structure 20, language 25.
 * When pace is unknown (no timing available) its weight is redistributed across
 * the rest, so a missing measurement never masquerades as a bad score.
 */
export function analyseSpokenEnglish(sample: SpokenSample): CommunicationReport {
  const text = (sample.text ?? "").trim();
  const tokens = tokenize(text);
  const wordCount = tokens.length;
  const tooShort = wordCount < MIN_WORDS_FOR_SCORE;

  const sentences = splitSentences(text);
  const sentenceLengths = sentences.map((sentence) => tokenize(sentence).length);

  const durationMs = sample.durationMs ?? 0;
  const minutes = durationMs > 0 ? durationMs / 60_000 : 0;
  const wordsPerMinute = minutes > 0 && wordCount > 0 ? wordCount / minutes : null;

  // Fillers: the damped words count half, and every match is masked so the same
  // span is never scored twice.
  const hardFillers = FILLERS.filter((filler) => !SOFT_FILLERS.has(filler));
  const softFillers = FILLERS.filter((filler) => SOFT_FILLERS.has(filler));

  let masked = ` ${text.toLowerCase()} `;
  let fillerCount = 0;
  for (const phrase of softFillers) {
    const pattern = new RegExp(`(^|[^a-z'])${escapeRegExp(phrase)}(?![a-z'])`, "g");
    masked = masked.replace(pattern, (_match, before: string) => {
      fillerCount += 0.5;
      return `${before} `;
    });
  }
  fillerCount += countPhrases(masked, hardFillers).count;

  const fillersPer100Words = wordCount > 0 ? (fillerCount / wordCount) * 100 : 0;

  const { count: hedgeCount } = countPhrases(text, HEDGES);
  const { count: ownershipCount } = countPhrases(text, OWNERSHIP_MARKERS);
  const { count: weakOpenerCount } = countPhrases(text, WEAK_OPENERS);

  const unique = new Set(tokens).size;
  const typeTokenRatio = wordCount > 0 ? unique / Math.sqrt(wordCount) : 0;
  const longWordRatio =
    wordCount > 0 ? tokens.filter((token) => token.length >= 8).length / wordCount : 0;

  const star = starCoverage(text);

  const avgSentenceWords = sentenceLengths.length
    ? sentenceLengths.reduce((sum, length) => sum + length, 0) / sentenceLengths.length
    : 0;
  const sentenceVariety = sentenceLengths.length > 1 ? variance(sentenceLengths) : 0;

  const pace = paceScore(wordsPerMinute);

  // Fluency: penalise filler density and apologetic openers.
  const fluency = clamp(100 - fillersPer100Words * 7 - weakOpenerCount * 4);

  // Structure: STAR coverage, plus natural sentence-length variation so the
  // delivery does not read as a monotone script.
  const structure = clamp((star.starScore / 4) * 80 + clamp(sentenceVariety * 12, 0, 20));

  // Language: lexical variety and precise vocabulary, nudged down by hedging
  // and up by active ownership.
  const language = clamp(
    45 +
      clamp((typeTokenRatio - 2.6) * 22, -20, 25) +
      clamp((longWordRatio - 0.12) * 90, -10, 15) +
      Math.min(ownershipCount, 4) * 3 -
      Math.min(hedgeCount, 5) * 2.5
  );

  let weightedTotal = 0;
  let weightTotal = 0;
  if (pace !== null) {
    weightedTotal += pace * 25;
    weightTotal += 25;
  }
  weightedTotal += fluency * 30 + structure * 20 + language * 25;
  weightTotal += 75;

  const score = tooShort ? 0 : Math.round(weightedTotal / weightTotal);

  const signals: Signals = {
    fluency,
    fillersPer100Words,
    structure,
    star,
    starScore: star.starScore,
    wordsPerMinute,
    ownershipCount,
    hedgeCount,
    language,
    tooShort,
    weakOpenerCount,
    avgSentenceWords,
    sentenceLengths: sentenceLengths.length,
  };

  return {
    score: clamp(score),
    band: tooShort ? "needs-work" : bandFor(score),
    tooShort,
    wordCount,
    wordsPerMinute: wordsPerMinute === null ? null : Math.round(wordsPerMinute),
    fillerCount: Math.round(fillerCount * 10) / 10,
    fillersPer100Words: Math.round(fillersPer100Words * 10) / 10,
    sentenceCount: sentences.length,
    avgSentenceWords: Math.round(avgSentenceWords * 10) / 10,
    sentenceVariety: Math.round(sentenceVariety * 10) / 10,
    typeTokenRatio: Math.round(typeTokenRatio * 100) / 100,
    longWordRatio: Math.round(longWordRatio * 100) / 100,
    hedgeCount,
    ownershipCount,
    star,
    starScore: star.starScore,
    strengths: collectStrengths(signals),
    improvements: collectImprovements(signals),
    parts: {
      pace: pace === null ? null : Math.round(pace),
      fluency: Math.round(fluency),
      structure: Math.round(structure),
      language: Math.round(language),
    },
  };
}