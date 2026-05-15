/**
 * Torrentio's Stremio addon embeds per-stream stats in the second `\n`-
 * delimited line of the `title` field, e.g.
 *
 * ```
 * The.Matrix.1999.1080p.BluRay.x264-RELEASE
 * 👤 42 💾 8.5 GB ⚙️ ThePirateBay
 * ```
 *
 * Only `👤` (seeders) and `💾` (size) are documented; the addon does not
 * surface leecher counts.
 */

const STAT_LINE_PREFIX = "👤";
const SEEDER_MARKER = "👤";
const SIZE_MARKER = "💾";

// Size units used by Torrentio. The Stremio addon outputs JEDEC-style units
// (KB / MB / GB / TB) but the values are always reported in binary multiples
// (1 KB == 1024 bytes). We follow Torrentio's own convention here.
const SIZE_UNIT_MULTIPLIERS: Readonly<Record<string, number>> = {
  B: 1,
  KB: 1024,
  MB: 1024 ** 2,
  GB: 1024 ** 3,
  TB: 1024 ** 4,
};

const SIZE_PATTERN = /(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)/i;
const SEEDER_PATTERN = /^\s*(\d+)\b/;

export interface TorrentioStreamStats {
  size: number | null;
  seeders: number | null;
}

/**
 * Parse the embedded stats line out of a Torrentio stream title.
 *
 * Returns `{ size: null, seeders: null }` if the response does not include a
 * stats line. Never throws; never fabricates a value when only one marker is
 * present.
 */
export function parseTorrentioStreamStats(title: string): TorrentioStreamStats {
  const statsLineStart = title.indexOf(`\n${STAT_LINE_PREFIX}`);

  if (statsLineStart === -1) {
    return { size: null, seeders: null };
  }

  const statsLine = title.slice(statsLineStart + 1).split("\n")[0] ?? "";

  return {
    size: readSize(statsLine),
    seeders: readSeeders(statsLine),
  };
}

function readSeeders(statsLine: string): number | null {
  const markerIndex = statsLine.indexOf(SEEDER_MARKER);

  if (markerIndex === -1) {
    return null;
  }

  const remainder = statsLine.slice(markerIndex + SEEDER_MARKER.length);
  const match = SEEDER_PATTERN.exec(remainder);

  if (!match) {
    return null;
  }

  const value = Number.parseInt(match[1] ?? "", 10);

  return Number.isFinite(value) ? value : null;
}

function readSize(statsLine: string): number | null {
  const markerIndex = statsLine.indexOf(SIZE_MARKER);

  if (markerIndex === -1) {
    return null;
  }

  const remainder = statsLine.slice(markerIndex + SIZE_MARKER.length);
  const match = SIZE_PATTERN.exec(remainder);

  if (!match) {
    return null;
  }

  const [, rawValue, rawUnit] = match;

  if (!rawValue || !rawUnit) {
    return null;
  }

  const value = Number.parseFloat(rawValue);
  const multiplier = SIZE_UNIT_MULTIPLIERS[rawUnit.toUpperCase()];

  if (!Number.isFinite(value) || multiplier === undefined) {
    return null;
  }

  return Math.round(value * multiplier);
}
