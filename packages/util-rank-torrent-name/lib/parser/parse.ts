import { Parser, transforms } from "@viren070/parse-torrent-title";

import { bitDepthHandlers } from "../parser/handlers/bit-depth.handlers.ts";
import { sceneHandlers } from "../parser/handlers/scene.handlers.ts";
import { siteHandlers } from "../parser/handlers/site.handlers.ts";
import { trashHandlers } from "../parser/handlers/trash.handlers.ts";
import { normaliseTitle } from "../shared/normalise.ts";
import { adultHandlers } from "./handlers/adult.handlers.ts";

import type { CustomFields, ParsedData } from "../types.ts";

const parser = new Parser()
  .addHandlers(adultHandlers)
  .addHandlers(siteHandlers)
  .addHandlers(sceneHandlers)
  .addHandlers(trashHandlers)
  .addHandlers(bitDepthHandlers)
  .addHandlers([
    {
      field: "channels",
      pattern: new RegExp("\\+?2[\\.\\s]0(?:x[2-4])?\\b", "i"),
      transform: transforms.toValueSet("2.0"),
      remove: true,
      keepMatching: true,
    },
  ])
  .addHandlers([
    {
      field: "complete",
      pattern: new RegExp(
        "(?:\\bthe\\W)?(?:\\bcomplete\\b|\\bfull\\b|\\ball\\b)\\b.*\\b(?:series|seasons|collection|episodes|set|pack|movies)\\b",
        "i",
      ),
      transform: transforms.toBoolean(),
      remove: true,
    },
  ])
  .addDefaultHandlers()
  .addHandlers([
    {
      field: "episodes",
      process: (title, m, result) => {
        const animePattern = new RegExp("One.*?Piece|Bleach|Naruto");

        if (animePattern.test(title)) {
          if (result.has("episodes")) {
            return m;
          }

          const episodePattern = new RegExp("\\b\\d{1,4}\\b");
          const matches = episodePattern.exec(title);

          if (matches) {
            m.value = [parseInt(matches[0], 10)];
            m.mIndex = matches.index;
            m.remove = true;
          }
        }

        return m;
      },
    },
  ])
  .addHandlers([
    {
      field: "bitrate",
      pattern: new RegExp("\\b\\d+[kmg]bps\\b", "i"),
      matchGroup: 1,
      remove: true,
      transform: transforms.toLowercase(),
    },
  ])
  .addHandlers([
    {
      field: "country",
      pattern: new RegExp("\\b(US|UK|AU|NZ|CA)\\b"),
    },
  ])
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
      transform: transforms.toTrimmed(),
      remove: true,
    },
  ])
  .addHandlers([
    {
      field: "title",
      pattern: new RegExp("\\bHigh.?Quality\\b", "i"),
      remove: true,
      skipFromTitle: true,
    },
  ]);

export function parse(rawTitle: string): ParsedData {
  if (!rawTitle || typeof rawTitle !== "string") {
    throw new TypeError("The input title must be a non-empty string.");
  }

  const parseResult = parser.parse<CustomFields>(rawTitle);

  const title = parseResult.title ?? "";
  const seasons = parseResult.seasons ?? [];
  const episodes = parseResult.episodes ?? [];
  const quality = parseResult.quality;

  // Derive remux from quality
  const remux = ["bluray remux", "remux"].includes(
    quality?.toLowerCase() ?? "",
  );

  // ptt-viren year is string, parse to number
  const year = parseResult.year ? parseInt(parseResult.year, 10) : undefined;

  return {
    rawTitle,
    title,
    normalizedTitle: normaliseTitle(title),
    seasons,
    episodes,
    scene: parseResult.scene ?? false,
    resolution: parseResult.resolution ?? "unknown",
    languages: parseResult.languages ?? [],
    type: seasons.length > 0 || episodes.length > 0 ? "show" : "movie",
    ...(year && !isNaN(year) ? { year } : {}),
    ...(quality ? { quality } : {}),
    ...(parseResult.codec ? { codec: parseResult.codec } : {}),
    ...(parseResult.adult ? { adult: parseResult.adult } : {}),
    ...(parseResult.bitDepth ? { bitDepth: parseResult.bitDepth } : {}),
    ...(parseResult.bitrate ? { bitrate: parseResult.bitrate } : {}),
    ...(parseResult.date ? { date: parseResult.date } : {}),
    ...(parseResult.group ? { group: parseResult.group } : {}),
    ...(parseResult.edition ? { edition: parseResult.edition } : {}),
    ...(parseResult.network ? { network: parseResult.network } : {}),
    ...(parseResult.region ? { region: parseResult.region } : {}),
    ...(parseResult.site ? { site: parseResult.site } : {}),
    ...(parseResult.size ? { size: parseResult.size } : {}),
    ...(parseResult.container ? { container: parseResult.container } : {}),
    ...(parseResult.extension ? { extension: parseResult.extension } : {}),
    ...(parseResult.episodeCode
      ? { episodeCode: parseResult.episodeCode }
      : {}),
    ...(parseResult.dubbed ? { dubbed: parseResult.dubbed } : {}),
    ...(parseResult.subbed ? { subbed: parseResult.subbed } : {}),
    ...(parseResult.hardcoded ? { hardcoded: parseResult.hardcoded } : {}),
    ...(parseResult.proper ? { proper: parseResult.proper } : {}),
    ...(parseResult.repack ? { repack: parseResult.repack } : {}),
    ...(parseResult.retail ? { retail: parseResult.retail } : {}),
    ...(parseResult.upscaled ? { upscaled: parseResult.upscaled } : {}),
    ...(parseResult.remastered ? { remastered: parseResult.remastered } : {}),
    ...(parseResult.extended ? { extended: parseResult.extended } : {}),
    ...(parseResult.unrated ? { unrated: parseResult.unrated } : {}),
    ...(parseResult.uncensored ? { uncensored: parseResult.uncensored } : {}),
    ...(parseResult.documentary
      ? { documentary: parseResult.documentary }
      : {}),
    ...(parseResult.commentary ? { commentary: parseResult.commentary } : {}),
    ...(parseResult.complete ? { complete: parseResult.complete } : {}),
    ...(parseResult.ppv ? { ppv: parseResult.ppv } : {}),
    ...(parseResult.trash ? { trash: parseResult.trash } : {}),
    ...(parseResult.country ? { country: parseResult.country } : {}),
    ...(parseResult.site ? { site: parseResult.site } : {}),
    ...(parseResult.volumes?.length ? { volumes: parseResult.volumes } : {}),
    ...(parseResult.releaseTypes?.length
      ? { releaseTypes: parseResult.releaseTypes }
      : {}),
    ...(parseResult.audio?.length ? { audio: parseResult.audio } : {}),
    ...(parseResult.channels?.length ? { channels: parseResult.channels } : {}),
    ...(parseResult.hdr?.length ? { hdr: parseResult.hdr } : {}),
    ...(parseResult.threeD ? { threeD: !!parseResult.threeD } : {}),
    ...(remux ? { remux } : {}),
    ...(parseResult.convert ? { converted: parseResult.convert } : {}),
  };
}
