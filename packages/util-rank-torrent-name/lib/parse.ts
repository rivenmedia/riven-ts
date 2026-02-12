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
  const remux = ["bluray remux", "remux"].includes(
    quality?.toLowerCase() ?? "",
  );

  // ptt-viren threeD is a string (e.g. "3D"), coerce to boolean
  const threeD = !!ptt.threeD;

  // ptt-viren year is string, parse to number
  const year = ptt.year ? parseInt(ptt.year, 10) : undefined;

  return {
    rawTitle,
    title,
    normalizedTitle: normalizeTitle(title),
    seasons,
    episodes,
    resolution: ptt.resolution ?? "unknown",
    complete: ptt.complete ?? false,
    languages: ptt.languages ?? [],
    type: seasons.length > 0 || episodes.length > 0 ? "show" : "movie",
    ...(year && !isNaN(year) ? { year } : {}),
    ...(quality ? { quality } : {}),
    ...(ptt.codec ? { codec: ptt.codec } : {}),
    ...(ptt.bitDepth ? { bitDepth: ptt.bitDepth } : {}),
    ...(ptt.date ? { date: ptt.date } : {}),
    ...(ptt.group ? { group: ptt.group } : {}),
    ...(ptt.edition ? { edition: ptt.edition } : {}),
    ...(ptt.network ? { network: ptt.network } : {}),
    ...(ptt.region ? { region: ptt.region } : {}),
    ...(ptt.site ? { site: ptt.site } : {}),
    ...(ptt.size ? { size: ptt.size } : {}),
    ...(ptt.container ? { container: ptt.container } : {}),
    ...(ptt.extension ? { extension: ptt.extension } : {}),
    ...(ptt.episodeCode ? { episodeCode: ptt.episodeCode } : {}),
    ...(ptt.dubbed ? { dubbed: ptt.dubbed } : {}),
    ...(ptt.subbed ? { subbed: ptt.subbed } : {}),
    ...(ptt.hardcoded ? { hardcoded: ptt.hardcoded } : {}),
    ...(ptt.proper ? { proper: ptt.proper } : {}),
    ...(ptt.repack ? { repack: ptt.repack } : {}),
    ...(ptt.retail ? { retail: ptt.retail } : {}),
    ...(ptt.upscaled ? { upscaled: ptt.upscaled } : {}),
    ...(ptt.remastered ? { remastered: ptt.remastered } : {}),
    ...(ptt.extended ? { extended: ptt.extended } : {}),
    ...(ptt.unrated ? { unrated: ptt.unrated } : {}),
    ...(ptt.uncensored ? { uncensored: ptt.uncensored } : {}),
    ...(ptt.documentary ? { documentary: ptt.documentary } : {}),
    ...(ptt.commentary ? { commentary: ptt.commentary } : {}),
    ...(ptt.ppv ? { ppv: ptt.ppv } : {}),
    ...(ptt.volumes?.length ? { volumes: ptt.volumes } : {}),
    ...(ptt.audio?.length ? { audio: ptt.audio } : {}),
    ...(ptt.channels?.length ? { channels: ptt.channels } : {}),
    ...(ptt.hdr?.length ? { hdr: ptt.hdr } : {}),
    ...(threeD ? { threeD } : {}),
    ...(remux ? { remux } : {}),
    ...(ptt.convert ? { converted: ptt.convert } : {}),
  };
}
