import type { RequestPreferences } from "@repo/util-plugin-sdk/schemas/request-preferences.schema";
import type { ParsedData } from "@repo/util-rank-torrent-name";

/**
 * Determines whether a torrent should be skipped based on the preferences of its item request.
 *
 * @param parsedData The parsed torrent data.
 * @param preferences The preferences of the item request, if any.
 * @returns A skip reason when the torrent does not match the preferences, `null` otherwise.
 */
export function shouldSkipTorrent(
  parsedData: ParsedData,
  preferences: RequestPreferences | null | undefined,
): string | null {
  if (!preferences) {
    return null;
  }

  const { resolutions, language } = preferences;

  if (
    resolutions &&
    !resolutions.some((resolution) => resolution === parsedData.resolution)
  ) {
    return `resolution ${parsedData.resolution} is not one of the allowed resolutions (${resolutions.join(", ")})`;
  }

  if (
    language &&
    !parsedData.languages.some(
      (torrentLanguage) =>
        torrentLanguage.toLowerCase() === language.toLowerCase(),
    )
  ) {
    return `language is not ${language}`;
  }

  return null;
}
