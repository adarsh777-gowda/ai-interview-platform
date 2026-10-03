/**
 * Parsing a Java problem statement into labelled sections.
 *
 * The bank stores each statement as one plain string, but a wall of prose makes
 * the I/O contract easy to miss. Writing statements as
 *
 *     Goal
 *     ...
 *     Input
 *     ...
 *     Output
 *     ...
 *     Constraints
 *     - ...
 *
 * lets the UI show Goal / Input / Output / Constraints as separate blocks while
 * the data stays a single string. Pure functions, no Node APIs, so it is unit
 * testable like the rest of `src/lib/java`.
 */

/** Section names the parser recognises, in the order they should be displayed. */
export const STATEMENT_SECTIONS = [
  "Goal",
  "Input",
  "Output",
  "Constraints",
  "Note",
] as const;

export type StatementSectionName = (typeof STATEMENT_SECTIONS)[number];

export type StatementSection = {
  name: StatementSectionName;
  /** Non-empty lines of the section, original order preserved. */
  lines: string[];
};

export type Statement = {
  sections: StatementSection[];
  /**
   * False when the prompt was plain prose with no headers (a legacy or
   * hand-written one). Callers can then fall back to rendering it verbatim.
   */
  structured: boolean;
};

const HEADER_LOOKUP = new Map<string, StatementSectionName>(
  STATEMENT_SECTIONS.map((name) => [name.toLowerCase(), name])
);

/** A bullet line inside a section (e.g. a constraint). */
const BULLET_PREFIX = "- ";

export function isBulletLine(line: string): boolean {
  return line.startsWith(BULLET_PREFIX);
}

export function parseStatement(prompt: string): Statement {
  const sections: StatementSection[] = [];
  let current: StatementSection | null = null;
  let sawHeader = false;

  for (const rawLine of prompt.split("\n")) {
    const line = rawLine.trim();
    const header = HEADER_LOOKUP.get(line.toLowerCase());

    // A header is only a header when the whole line is that word, so a sentence
    // like "Output the result" is never mistaken for the Output section.
    if (header) {
      current = { name: header, lines: [] };
      sections.push(current);
      sawHeader = true;
      continue;
    }

    if (!current) {
      // Prose before any header: treat it as the goal so nothing is lost.
      current = { name: "Goal", lines: [] };
      sections.push(current);
    }
    if (line !== "") current.lines.push(line);
  }

  return {
    sections: sections.filter((section) => section.lines.length > 0),
    structured: sawHeader,
  };
}

/**
 * True when the statement spells out the sections a coding problem needs.
 * Used by the bank tests so a prompt cannot silently regress to vague prose.
 */
export function hasRequiredSections(prompt: string): boolean {
  const { sections, structured } = parseStatement(prompt);
  if (!structured) return false;
  const names = new Set(sections.map((section) => section.name));
  return names.has("Goal") && names.has("Input") && names.has("Output");
}