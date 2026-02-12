import {
  type ParsedResult,
  parseTorrentTitle,
} from "@viren070/parse-torrent-title";

import { normalizeTitle } from "./normalize.ts";

import type { ParsedData } from "./types.ts";

export function parse(rawTitle: string): ParsedData {
  if (!rawTitle || typeof rawTitle !== "string") {
    throw new TypeError("The input title must be a non-empty string.");
  }

  const ptt: ParsedResult = parseTorrentTitle(rawTitle);

  const title = ptt.title ?? "";
  const seasons = ptt.seasons ?? [];
  const episodes = ptt.episodes ?? [];
  const quality = ptt.quality;

  // Derive remux from quality
  const remux = quality === "BluRay REMUX" || quality === "REMUX";

  // ptt-viren threeD is a string (e.g. "3D"), coerce to boolean
  const threeD = !!ptt.threeD;

  // ptt-viren convert -> converted
  const converted = ptt.convert ?? false;

  // ptt-viren year is string, parse to number
  const year = ptt.year ? parseInt(ptt.year, 10) : undefined;

  return {
    rawTitle,
    title,
    normalizedTitle: normalizeTitle(title),
    remux,
    seasons,
    episodes,
    threeD,
    converted,
    resolution: ptt.resolution ?? "unknown",
    complete: ptt.complete ?? false,
    volumes: ptt.volumes ?? [],
    audio: ptt.audio ?? [],
    channels: ptt.channels ?? [],
    hdr: ptt.hdr ?? [],
    languages: ptt.languages ?? [],
    dubbed: ptt.dubbed ?? false,
    subbed: ptt.subbed ?? false,
    hardcoded: ptt.hardcoded ?? false,
    proper: ptt.proper ?? false,
    repack: ptt.repack ?? false,
    retail: ptt.retail ?? false,
    upscaled: ptt.upscaled ?? false,
    remastered: ptt.remastered ?? false,
    extended: ptt.extended ?? false,
    unrated: ptt.unrated ?? false,
    uncensored: ptt.uncensored ?? false,
    documentary: ptt.documentary ?? false,
    commentary: ptt.commentary ?? false,
    ppv: ptt.ppv ?? false,
    type: seasons.length > 0 || episodes.length > 0 ? "show" : "movie",
    quality,
    bitDepth: ptt.bitDepth,
    codec: ptt.codec,
    date: ptt.date,
    group: ptt.group,
    edition: ptt.edition,
    network: ptt.network,
    region: ptt.region,
    site: ptt.site,
    size: ptt.size,
    container: ptt.container,
    extension: ptt.extension,
    episodeCode: ptt.episodeCode,
    year: year && !isNaN(year) ? year : undefined,
  };
}
