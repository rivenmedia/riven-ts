import type { SubtitleResponse } from "../schemas/subtitle-response.schema.ts";
import type { ItemMetadata } from "./get-item-metadata.ts";

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

    const subLangLower = sub.lang.toLowerCase();

    if (!bestPerLanguage.has(subLangLower)) {
      bestPerLanguage.set(subLangLower, sub);
    }
  }

  return bestPerLanguage;
}
