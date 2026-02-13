import { Parser } from "@viren070/parse-torrent-title";

import { bitDepthHandlers } from "./handlers/bit-depth.handlers.ts";
import { sceneHandlers } from "./handlers/scene.handlers.ts";
import { siteHandlers } from "./handlers/site.handlers.ts";
import { trashHandlers } from "./handlers/trash.handlers.ts";
import { AUDIO_MAP, CODEC_MAP, RESOLUTION_MAP } from "./mappings.ts";
import { normalizeTitle } from "./normalize.ts";

import type { CustomFields, ParsedData } from "./types.ts";

const parser = new Parser()
  .addHandlers(siteHandlers)
  .addHandlers(sceneHandlers)
  .addHandlers(trashHandlers)
  .addHandlers(bitDepthHandlers)
  .addDefaultHandlers(
    "audio",
    "bitDepth",
    "channels",
    "codec",
    "commentary",
    "complete",
    "container",
    "convert",
    "date",
    "documentary",
    "ppv",
    "dubbed",
    "edition",
    "episodeCode",
    "episodes",
    "extended",
    "extension",
    "group",
    "hdr",
    "hardcoded",
    "languages",
    "network",
    "proper",
    "quality",
    "region",
    "releaseTypes",
    "remastered",
    "repack",
    "resolution",
    "retail",
    "seasons",
    "site",
    "size",
    "subbed",
    "threeD",
    "title",
    "uncensored",
    "unrated",
    "upscaled",
    "volumes",
    "year",
  )
  .addHandlers([
    {
      field: "site",
      pattern: new RegExp(
        "\\b(?:www?.?)?(?:\\w+\\-)?\\w+[\\.\\s](?:com|org|net|ms|tv|mx|co|party|vip|nu|pics)\\b",
        "i",
      ),
      matchGroup: 1,
      remove: true,
    },
    {
      field: "site",
      pattern: new RegExp("rarbg|torrentleech|(?:the)?piratebay", "i"),
      remove: true,
    },
    {
      field: "site",
      pattern: new RegExp("\\[([^\\]]+\\.[^\\]]+)\\](?=\\.\\w{2,4}$|\\s)", "i"),
      remove: true,
    },
  ]);

export function parse(rawTitle: string): ParsedData {
  if (!rawTitle || typeof rawTitle !== "string") {
    throw new TypeError("The input title must be a non-empty string.");
  }

  const ptt = parser.parse<CustomFields>(rawTitle);

  const title = ptt.title ?? "";
  const seasons = ptt.seasons ?? [];
  const episodes = ptt.episodes ?? [];
  const quality = ptt.quality;

  // Derive remux from quality
  const remux = ["bluray remux", "remux"].includes(
    quality?.toLowerCase() ?? "",
  );

  // ptt-viren year is string, parse to number
  const year = ptt.year ? parseInt(ptt.year, 10) : undefined;

  const [, mappedCodec] = CODEC_MAP.get(ptt.codec?.toLowerCase() ?? "") ?? [];

  const mappedResolution = RESOLUTION_MAP.get(
    ptt.resolution?.toLowerCase() ?? "",
  );

  return {
    rawTitle,
    title,
    normalizedTitle: normalizeTitle(title),
    seasons,
    episodes,
    scene: ptt.scene ?? false,
    resolution: mappedResolution ?? ptt.resolution ?? "unknown",
    languages: ptt.languages ?? [],
    type: seasons.length > 0 || episodes.length > 0 ? "show" : "movie",
    ...(year && !isNaN(year) ? { year } : {}),
    ...(quality ? { quality } : {}),
    ...(mappedCodec ? { codec: mappedCodec } : {}),
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
    ...(ptt.complete ? { complete: ptt.complete } : {}),
    ...(ptt.ppv ? { ppv: ptt.ppv } : {}),
    ...(ptt.trash ? { trash: ptt.trash } : {}),
    ...(ptt.site ? { site: ptt.site } : {}),
    ...(ptt.volumes?.length ? { volumes: ptt.volumes } : {}),
    ...(ptt.audio?.length
      ? {
          audio: ptt.audio.map((a) => {
            const normalisedAudio = a.toLowerCase();

            return AUDIO_MAP.get(normalisedAudio)?.[1] ?? normalisedAudio;
          }),
        }
      : {}),
    ...(ptt.channels?.length ? { channels: ptt.channels } : {}),
    ...(ptt.hdr?.length ? { hdr: ptt.hdr } : {}),
    ...(ptt.threeD ? { "3d": !!ptt.threeD } : {}),
    ...(remux ? { remux } : {}),
    ...(ptt.convert ? { converted: ptt.convert } : {}),
  };
}
