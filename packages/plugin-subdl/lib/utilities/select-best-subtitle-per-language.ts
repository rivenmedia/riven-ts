import type { SubtitleResponse } from "../schemas/subtitle-response.schema.ts";
import type { ItemMetadata } from "./get-item-metadata.ts";

const brazilianPortugueseVariants = new Set([
  "brazillian-portuguese",
  "brazillian portuguese",
  "brazilian-portuguese",
  "brazilian portuguese",
]);

function normalizeLanguage(language: string) {
  const normalized = language.toLowerCase();

  return brazilianPortugueseVariants.has(normalized) ? "pt-BR" : normalized;
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
