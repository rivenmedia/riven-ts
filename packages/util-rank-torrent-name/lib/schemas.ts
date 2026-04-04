import { type } from "arktype";

import { normaliseTitle } from "./shared/normalise.ts";

const nonEmptyString = type("string > 0");
const positiveIntSchema = type("number.integer > 0");
const nonnegativeIntSchema = type("number.integer >= 0");

const bitDepthEnum = type("string")
  .pipe((val) => val.replaceAll(".", ""))
  .pipe(type.enumerated("8bit", "10bit", "12bit"));

export type BitDepth = typeof bitDepthEnum.infer;

export const ParsedData = type({
  rawTitle: nonEmptyString,
  title: nonEmptyString,
  "year?": type("string.integer.parse").pipe(positiveIntSchema),
  resolution: nonEmptyString.default("unknown"),
  "quality?": nonEmptyString,
  "codec?": nonEmptyString,
  bitDepth: bitDepthEnum.optional(),
  seasons: nonnegativeIntSchema.array().default(() => []),
  episodes: nonnegativeIntSchema.array().default(() => []),
  "complete?": "boolean",
  "volumes?": nonnegativeIntSchema.array(),
  "audio?": nonEmptyString.array(),
  "channels?": nonEmptyString.array(),
  "hdr?": nonEmptyString.array(),
  languages: nonEmptyString.array().default(() => []),
  "dubbed?": "boolean",
  "subbed?": "boolean",
  "hardcoded?": "boolean",
  "proper?": "boolean",
  "repack?": "boolean",
  "remux?": "boolean",
  "retail?": "boolean",
  "upscaled?": "boolean",
  "remastered?": "boolean",
  "extended?": "boolean",
  "convert?": "boolean",
  "unrated?": "boolean",
  "uncensored?": "boolean",
  "documentary?": "boolean",
  "commentary?": "boolean",
  "threeD?": "boolean",
  "ppv?": "boolean",
  "date?": nonEmptyString,
  "group?": nonEmptyString,
  "edition?": nonEmptyString,
  "network?": nonEmptyString,
  "region?": nonEmptyString,
  "site?": nonEmptyString,
  "size?": nonEmptyString,
  "container?": nonEmptyString,
  "extension?": nonEmptyString,
  "episodeCode?": nonEmptyString,
  "releaseTypes?": nonEmptyString.array(),

  // Custom fields
  "adult?": "boolean",
  "scene?": "boolean",
  "trash?": "boolean",
  "country?": nonEmptyString,
  "bitrate?": nonEmptyString,
}).pipe((data) => ({
  ...data,
  type:
    data.seasons.length || data.episodes.length
      ? ("show" as const)
      : ("movie" as const),
  normalisedTitle: normaliseTitle(data.title),
  converted: data.convert ?? false,
  remux:
    data.remux ??
    (data.quality
      ? ["remux", "bluray remux"].includes(data.quality.toLowerCase())
      : false),
}));

export type ParsedData = typeof ParsedData.infer;

export const Resolution = type.enumerated(
  "2160p",
  "1440p",
  "1080p",
  "720p",
  "480p",
  "360p",
  "unknown",
);

export type Resolution = typeof Resolution.infer;

export const ResolutionRank = Resolution.distribute(
  (branch) => branch,
  (branches) =>
    branches.reduce<Record<Resolution, number>>(
      (acc, res, index) => ({
        ...acc,
        [res]: Resolution.options.length - index,
      }),
      {} as Record<Resolution, number>,
    ),
);
