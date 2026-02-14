import { distance } from "fastest-levenshtein";

import { normaliseTitle } from "../shared/normalise.ts";

export type Aliases = Record<string, string[]>;

/**
 * Compute the Levenshtein ratio between two strings.
 * Uses the same formula as python-Levenshtein:
 *   ratio = (len(a) + len(b) - distance) / (len(a) + len(b))
 */
function levRatio(a: string, b: string): number {
  const totalLen = a.length + b.length;

  if (totalLen === 0) {
    return 1;
  }

  return (totalLen - distance(a, b)) / totalLen;
}

/**
 * Compare a parsed title against a correct title (and optional aliases)
 * using the Levenshtein ratio on normalized titles.
 *
 * Ratios below the threshold are returned as 0, matching
 * python-Levenshtein's score_cutoff behavior.
 *
 * @returns The highest ratio across all candidate titles, or 0 if below threshold
 */
export function getLevRatio(
  correctTitle: string,
  parsedTitle: string,
  threshold: number,
  aliases: Aliases = {},
): number {
  if (!correctTitle || !parsedTitle) {
    throw new Error("Both titles must be provided.");
  }

  if (typeof threshold !== "number" || threshold < 0 || threshold > 1) {
    throw new Error("The threshold must be a number between 0 and 1.");
  }

  const normalizedParsed = normaliseTitle(parsedTitle);

  const candidates = new Set<string>([normaliseTitle(correctTitle)]);

  for (const aliasList of Object.values(aliases)) {
    for (const alias of aliasList) {
      candidates.add(normaliseTitle(alias));
    }
  }

  let best = 0;

  for (const candidate of candidates) {
    const r = levRatio(candidate, normalizedParsed);

    if (r > best) {
      best = r;
    }
  }

  return best >= threshold ? best : 0;
}

/**
 * Check if a parsed title matches a correct title within the similarity threshold.
 */
export function titleMatch(
  correctTitle: string,
  parsedTitle: string,
  threshold: number,
  aliases: Aliases = {},
): boolean {
  return (
    getLevRatio(correctTitle, parsedTitle, threshold, aliases) >= threshold
  );
}
