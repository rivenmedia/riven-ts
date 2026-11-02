import type { SubtitleResponse } from "../schemas/subtitle-response.schema.ts";
import type { ItemMetadata } from "./get-item-metadata.ts";

/**
 * Compare language-name tokens while tolerating a single insertion, deletion,
 * or substitution. This avoids maintaining a list of provider-specific typos.
 */
function isWithinOneEdit(value: string, target: string): boolean {
  if (Math.abs(value.length - target.length) > 1) {
    return false;
  }

  let valueIndex = 0;
  let targetIndex = 0;
  let edits = 0;

  while (valueIndex < value.length && targetIndex < target.length) {
    if (value[valueIndex] === target[targetIndex]) {
      valueIndex++;
      targetIndex++;
      continue;
    }

    if (++edits > 1) {
      return false;
    }

    if (value.length >= target.length) {
      valueIndex++;
    }

    if (value.length <= target.length) {
      targetIndex++;
    }
  }

  return (
    edits + Number(valueIndex < value.length || targetIndex < target.length) <= 1
  );
}

function normalizeLanguage(language: string) {
  const normalized = language.toLowerCase();
  const words = normalized.trim().split(/[\s_-]+/);

  // Other languages (including generic Portuguese) are left unchanged.
  if (
    words.length === 2 &&
    words[1] === "portuguese" &&
    isWithinOneEdit(words[0] ?? "", "brazilian")
  ) {
    return "pt-BR";
  }

  return normalized;
}

/**
 * Picks the best subtitle per language (first matching result per language)
 */
export function selectBestSubtitlePerLanguage(
  results: SubtitleResponse[],
  { type, seasonNumber, episodeNumber }: ItemMetadata,
) {
  const bestPerLanguage = new Map<string, SubtitleResponse>();
  const isEpisodeSearch = type === "tv" && seasonNumber && episodeNumber;

  for (const sub of results) {
    const isMatchingSubtitle =
      !isEpisodeSearch ||
      (sub.season === seasonNumber && sub.episode === episodeNumber);

    if (!isMatchingSubtitle) {
      continue;
    }

    const language = normalizeLanguage(sub.lang);

    if (!bestPerLanguage.has(language)) {
      bestPerLanguage.set(language, sub);
    }
  }

  return bestPerLanguage;
}
