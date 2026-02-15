import z from "zod";

import { normaliseTitle } from "./shared/normalise.ts";

const nonEmptyString = z.string().min(1);
const positiveIntSchema = z.int().positive();

const bitDepthEnum = z.enum(["8bit", "10bit", "12bit"]);

export type BitDepth = z.infer<typeof bitDepthEnum>;

export const ParsedDataSchema = z
  .object({
    rawTitle: nonEmptyString,
    title: nonEmptyString,
    year: z.preprocess(
      (val) => (typeof val === "string" ? parseInt(val, 10) : val),
      positiveIntSchema.optional(),
    ),
    resolution: nonEmptyString.default("unknown"),
    quality: nonEmptyString.optional(),
    codec: nonEmptyString.optional(),
    bitDepth: bitDepthEnum.optional(),
    seasons: z.array(positiveIntSchema).default([]),
    episodes: z.array(positiveIntSchema).default([]),
    complete: z.boolean().optional(),
    volumes: z.array(positiveIntSchema).optional(),
    audio: z.array(nonEmptyString).optional(),
    channels: z.array(nonEmptyString).optional(),
    hdr: z.array(nonEmptyString).optional(),
    languages: z.array(nonEmptyString).default([]),
    dubbed: z.boolean().optional(),
    subbed: z.boolean().optional(),
    hardcoded: z.boolean().optional(),
    proper: z.boolean().optional(),
    repack: z.boolean().optional(),
    remux: z.boolean().optional(),
    retail: z.boolean().optional(),
    upscaled: z.boolean().optional(),
    remastered: z.boolean().optional(),
    extended: z.boolean().optional(),
    convert: z.boolean().optional(),
    unrated: z.boolean().optional(),
    uncensored: z.boolean().optional(),
    documentary: z.boolean().optional(),
    commentary: z.boolean().optional(),
    threeD: z.coerce.boolean().optional(),
    ppv: z.boolean().optional(),
    date: nonEmptyString.optional(),
    group: nonEmptyString.optional(),
    edition: nonEmptyString.optional(),
    network: nonEmptyString.optional(),
    region: nonEmptyString.optional(),
    site: nonEmptyString.optional(),
    size: nonEmptyString.optional(),
    container: nonEmptyString.optional(),
    extension: nonEmptyString.optional(),
    episodeCode: nonEmptyString.optional(),
    releaseTypes: z.array(nonEmptyString).optional(),

    // Custom fields
    adult: z.boolean().optional(),
    scene: z.boolean().optional(),
    trash: z.boolean().optional(),
    country: nonEmptyString.optional(),
    bitrate: nonEmptyString.optional(),
  })
  .transform((data) => ({
    ...data,
    type: data.seasons.length || data.episodes.length ? "show" : "movie",
    normalisedTitle: normaliseTitle(data.title),
    converted: data.convert ?? false,
    remux:
      data.remux ??
      ["remux", "bluray remux"].includes(data.quality?.toLowerCase() ?? ""),
  }));

export type ParsedData = z.infer<typeof ParsedDataSchema>;

export const Resolution = z.enum([
  "2160p",
  "1080p",
  "1440p",
  "720p",
  "480p",
  "360p",
  "unknown",
]);

export type Resolution = z.infer<typeof Resolution>;
