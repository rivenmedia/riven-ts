/**
 * Extra utilities for torrent processing.
 *
 * Functions:
 * - `titleMatch`: Compare two titles using the Levenshtein ratio
 * - `getLevRatio`: Get the Levenshtein ratio between titles
 * - `sortTorrents`: Sort torrents by resolution and rank
 * - `extractSeasons`: Extract season numbers from a title
 * - `extractEpisodes`: Extract episode numbers from a title
 * - `episodesFromSeason`: Extract episodes for a specific season
 */
import { distance } from "fastest-levenshtein";
import ptt from "parse-torrent-title";

import { normalizeTitle } from "./patterns.ts";

import type { Torrent } from "./models.ts";
import type { ValueOf } from "type-fest";

/**
 * Resolution enum values for sorting.
 */
export const Resolution = {
  UHD_2160P: 9,
  UHD_1440P: 7,
  FHD_1080P: 6,
  HD_720P: 5,
  SD_576P: 4,
  SD_480P: 3,
  SD_360P: 2,
  UNKNOWN: 1,
} as const;

/**
 * Map resolution strings to Resolution enum.
 */
const RESOLUTION_MAP: Record<string, ValueOf<typeof Resolution>> = {
  "4k": Resolution.UHD_2160P,
  "2160p": Resolution.UHD_2160P,
  "1440p": Resolution.UHD_1440P,
  "1080p": Resolution.FHD_1080P,
  "720p": Resolution.HD_720P,
  "576p": Resolution.SD_576P,
  "480p": Resolution.SD_480P,
  "360p": Resolution.SD_360P,
  unknown: Resolution.UNKNOWN,
};

/**
 * Get the resolution enum value for a torrent.
 */
export function getResolution(torrent: Torrent): ValueOf<typeof Resolution> {
  return (
    RESOLUTION_MAP[torrent.data.resolution.toLowerCase()] ?? Resolution.UNKNOWN
  );
}

/**
 * Calculate the Levenshtein ratio between two strings.
 * Returns a value between 0 and 1, where 1 means identical.
 */
function levenshteinRatio(a: string, b: string): number {
  if (a === b) {
    return 1;
  }

  if (a.length === 0 || b.length === 0) {
    return 0;
  }

  const maxLen = Math.max(a.length, b.length);
  const dist = distance(a, b);

  return 1 - dist / maxLen;
}

/**
 * Compare two titles using the Levenshtein ratio to determine similarity.
 *
 * @param correctTitle - The reference title to compare against
 * @param parsedTitle - The title to compare with the reference
 * @param threshold - The similarity threshold (default: 0.85)
 * @param aliases - Optional dictionary of aliases for the correct title
 * @returns True if the titles match above the threshold
 */
export function titleMatch(
  correctTitle: string,
  parsedTitle: string,
  threshold = 0.85,
  aliases: Record<string, string[]> = {},
): boolean {
  const ratio = getLevRatio(correctTitle, parsedTitle, threshold, aliases);

  return ratio >= threshold;
}

/**
 * Calculate the Levenshtein ratio between titles.
 *
 * @param correctTitle - The reference title to compare against
 * @param parsedTitle - The title to compare with the reference
 * @param threshold - The similarity threshold (default: 0.85)
 * @param aliases - Optional dictionary of aliases for the correct title
 * @returns The highest Levenshtein ratio found
 */
export function getLevRatio(
  correctTitle: string,
  parsedTitle: string,
  threshold = 0.85,
  aliases: Record<string, string[]> = {},
): number {
  if (!correctTitle || !parsedTitle) {
    throw new Error("Both titles must be provided.");
  }

  if (typeof threshold !== "number" || threshold < 0 || threshold > 1) {
    throw new Error("The threshold must be a number between 0 and 1.");
  }

  const normalizedParsed = normalizeTitle(parsedTitle);
  const normalizedCorrect = normalizeTitle(correctTitle);

  // Collect all titles to compare against
  const titlesToCompare = [normalizedCorrect];

  // Add all aliases
  for (const aliasList of Object.values(aliases)) {
    for (const alias of aliasList) {
      titlesToCompare.push(normalizeTitle(alias));
    }
  }

  // Calculate ratios and return the maximum
  const ratios = titlesToCompare.reduce<number[]>((acc, title) => {
    const ratio = levenshteinRatio(title, normalizedParsed);

    // Only return ratio if it meets the threshold (for optimization)
    if (ratio < threshold) {
      return acc;
    }

    return [...acc, ratio];
  }, []);

  if (ratios.length === 0) {
    return 0;
  }

  return Math.max(...ratios);
}

/**
 * Sort torrents by resolution bucket and rank in descending order.
 *
 * @param torrents - Set of Torrent objects to sort
 * @param bucketLimit - Maximum number of torrents per resolution bucket (optional)
 * @param resolutions - List of resolutions to include (optional, empty = all)
 * @returns Map of infohash to Torrent objects, sorted by resolution and rank
 */
export function sortTorrents(
  torrents: Set<Torrent>,
  bucketLimit?: number,
  resolutions: ValueOf<typeof Resolution>[] = [],
): Map<string, Torrent> {
  // Filter by resolutions if specified
  const filtered =
    resolutions.length === 0
      ? Array.from(torrents)
      : Array.from(torrents).filter((t) =>
          resolutions.includes(getResolution(t)),
        );

  // Sort by resolution (descending) then by rank (descending)
  const sorted = filtered.sort((a, b) => {
    const resA = getResolution(a);
    const resB = getResolution(b);
    if (resA !== resB) {
      return resB - resA; // Higher resolution first
    }
    return b.rank - a.rank; // Higher rank first
  });

  // Apply bucket limits if specified
  if (bucketLimit && bucketLimit > 0) {
    const bucketGroups = new Map<ValueOf<typeof Resolution>, Torrent[]>();

    for (const torrent of sorted) {
      const resolution = getResolution(torrent);

      if (!bucketGroups.has(resolution)) {
        bucketGroups.set(resolution, []);
      }

      bucketGroups.get(resolution)?.push(torrent);
    }

    const result = new Map<string, Torrent>();

    for (const bucketTorrents of bucketGroups.values()) {
      for (const torrent of bucketTorrents.slice(0, bucketLimit)) {
        result.set(torrent.infohash, torrent);
      }
    }

    return result;
  }

  // Return all sorted torrents
  const result = new Map<string, Torrent>();

  for (const torrent of sorted) {
    result.set(torrent.infohash, torrent);
  }

  return result;
}

/**
 * Extract season numbers from a title.
 *
 * @param rawTitle - The original title to analyze
 * @returns Array of season numbers
 */
export function extractSeasons(rawTitle: string): number[] {
  if (!rawTitle || typeof rawTitle !== "string") {
    throw new TypeError("The input title must be a non-empty string.");
  }

  const parsed = ptt.parse(rawTitle);

  return parsed.season !== undefined ? [parsed.season] : [];
}

/**
 * Extract episode numbers from a title.
 *
 * @param rawTitle - The original title to analyze
 * @returns Array of episode numbers
 */
export function extractEpisodes(rawTitle: string): number[] {
  if (!rawTitle || typeof rawTitle !== "string") {
    throw new TypeError("The input title must be a non-empty string.");
  }

  const episodes: number[] = [];

  let match;

  // Multiple episodes: E01E02E03 (check first)
  const multiPattern =
    /\bE(\d{1,3})E(\d{1,3})(?:E(\d{1,3}))?(?:E(\d{1,3}))?\b/gi;

  while ((match = multiPattern.exec(rawTitle)) !== null) {
    for (let i = 1; i < match.length; i++) {
      const matchedEpisode = match[i];

      if (matchedEpisode) {
        const ep = parseInt(matchedEpisode, 10);

        if (ep > 0 && ep <= 9999 && !episodes.includes(ep)) {
          episodes.push(ep);
        }
      }
    }
  }

  // Range pattern with explicit E: E01-E05
  const explicitRangePattern = /\bE(\d{1,3})\s*[-–—]\s*E(\d{1,3})\b/gi;

  while ((match = explicitRangePattern.exec(rawTitle)) !== null) {
    const start = parseInt(match[1] ?? "", 10);
    const end = parseInt(match[2] ?? "", 10);

    if (start > 0 && end >= start && end <= 9999) {
      for (let i = start; i <= end; i++) {
        if (!episodes.includes(i)) {
          episodes.push(i);
        }
      }
    }
  }

  // Range pattern without E: E01-05 (only if reasonable range)
  const implicitRangePattern = /\bE(\d{1,3})\s*[-–—]\s*(\d{1,3})\b/gi;
  while ((match = implicitRangePattern.exec(rawTitle)) !== null) {
    if (/\bE\d{1,3}\s*[-–—]\s*E\d{1,3}\b/i.test(match[0])) {
      continue;
    }

    const start = parseInt(match[1] ?? "", 10);
    const end = parseInt(match[2] ?? "", 10);

    if (start > 0 && end >= start && end - start <= 50 && end <= 9999) {
      for (let i = start; i <= end; i++) {
        if (!episodes.includes(i)) {
          episodes.push(i);
        }
      }
    }
  }

  // Standard episode patterns: E01
  const ePattern = /\bE(\d{1,3})(?![E\d])\b/gi;

  while ((match = ePattern.exec(rawTitle)) !== null) {
    const ep = parseInt(match[1] ?? "", 10);

    if (ep > 0 && ep <= 9999 && !episodes.includes(ep)) {
      episodes.push(ep);
    }
  }

  // 6x05 style (season x episode)
  const altPattern = /\b\d{1,2}x(\d{1,3})\b/gi;

  while ((match = altPattern.exec(rawTitle)) !== null) {
    const ep = parseInt(match[1] ?? "", 10);

    if (ep > 0 && ep <= 9999 && !episodes.includes(ep)) {
      episodes.push(ep);
    }
  }

  // Anime-style: - 087 - (episode number between dashes)
  const animePattern = /\s-\s(\d{2,4})\s-\s/g;

  while ((match = animePattern.exec(rawTitle)) !== null) {
    const ep = parseInt(match[1] ?? "", 10);

    if (ep > 0 && ep <= 9999 && !episodes.includes(ep)) {
      episodes.push(ep);
    }
  }

  // Mini-series style: 2Of4
  const miniPattern = /\b(\d{1,2})Of\d{1,2}\b/gi;

  while ((match = miniPattern.exec(rawTitle)) !== null) {
    const ep = parseInt(match[1] ?? "", 10);

    if (ep > 0 && ep <= 999 && !episodes.includes(ep)) {
      episodes.push(ep);
    }
  }

  return episodes.sort((a, b) => a - b);
}

/**
 * Extract episode numbers for a specific season from a title.
 *
 * @param rawTitle - The original title to analyze
 * @param seasonNum - The season number to extract episodes for
 * @returns Array of episode numbers for the specified season
 */
export function episodesFromSeason(
  rawTitle: string,
  seasonNum: number,
): number[] {
  if (!seasonNum) {
    throw new Error("The season number must be provided.");
  }

  if (typeof seasonNum !== "number" || seasonNum <= 0) {
    throw new TypeError("The season number must be a positive integer.");
  }

  if (!rawTitle || typeof rawTitle !== "string") {
    throw new Error("The input title must be a non-empty string.");
  }

  const parsed = ptt.parse(rawTitle);
  const seasons = parsed.season !== undefined ? [parsed.season] : [];
  const episodes = parsed.episode !== undefined ? [parsed.episode] : [];

  if (seasons.includes(seasonNum)) {
    return episodes;
  }

  return [];
}
