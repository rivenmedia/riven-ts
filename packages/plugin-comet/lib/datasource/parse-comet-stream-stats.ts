/**
 * Comet's Stremio addon embeds per-stream stats in the `description` field
 * as emoji-prefixed tokens, e.g.
 *
 * ```
 *   The.Matrix.1999.1080p.BluRay.x264-RELEASE
 *   💾 8.5 GB 👤 42 🌐 ThePirateBay
 *   🇬🇧 RD+
 * ```
 *
 * Only `💾` (size) and `👤` (seeders) are documented. Comet does not surface
 * a leecher count in its Stremio response, so we never fabricate one.
 */

const SEEDER_MARKER = "👤";
const SIZE_MARKER = "💾";

// Comet (like Torrentio) reports sizes in JEDEC-style units (KB / MB / GB /
// TB), but with binary multiples (1 KB == 1024 bytes). We follow Comet's
// own convention here.
const SIZE_UNIT_MULTIPLIERS: Readonly<Record<string, number>> = {
  B: 1,
  KB: 1024,
  MB: 1024 ** 2,
  GB: 1024 ** 3,
  TB: 1024 ** 4,
};

const SIZE_PATTERN = /(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)/i;
const SEEDER_PATTERN = /^\s*(\d+)\b/;

export interface CometStreamStats {
  size: number | null;
  seeders: number | null;
}

function readSeeders(description: string): number | null {
  const markerIndex = description.indexOf(SEEDER_MARKER);

  if (markerIndex === -1) {
    return null;
  }

  const remainder = description.slice(markerIndex + SEEDER_MARKER.length);
  const match = SEEDER_PATTERN.exec(remainder);

  if (!match) {
    return null;
  }

  const value = Number.parseInt(match[1] ?? "", 10);

  return Number.isFinite(value) ? value : null;
}

function readSize(description: string): number | null {
  const markerIndex = description.indexOf(SIZE_MARKER);

  if (markerIndex === -1) {
    return null;
  }

  const remainder = description.slice(markerIndex + SIZE_MARKER.length);
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

/**
 * Parse the embedded stats out of a Comet stream `description`.
 *
 * Returns `{ size: null, seeders: null }` if the description does not contain
 * either marker. Never throws; never fabricates a value when only one marker
 * is present.
 */
export function parseCometStreamStats(description: string): CometStreamStats {
  return {
    size: readSize(description),
    seeders: readSeeders(description),
  };
}
