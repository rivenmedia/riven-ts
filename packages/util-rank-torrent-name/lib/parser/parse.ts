import {
  Parser,
  handlers as defaultHandlers,
  transforms,
} from "@viren070/parse-torrent-title";
import { merge } from "es-toolkit";
import z from "zod";

import { sceneHandlers } from "../parser/handlers/scene.handlers.ts";
import { trashHandlers } from "../parser/handlers/trash.handlers.ts";
import { ParsedDataSchema } from "../schemas.ts";
import { adultHandlers } from "./handlers/adult.handlers.ts";

import type { ParsedData } from "../schemas.ts";
import type { Handler } from "@viren070/parse-torrent-title";

const yearPattern = String.raw`\b(?:19|20)\d{2}\b`;

/**
 * Restricts a channels handler to only match after the year (if the title contains one),
 * so that titles such as "M3GAN 2.0" are not mistaken for audio channels.
 */
function matchChannelsAfterYear(handler: Handler): Handler {
  if (!handler.pattern) {
    return handler;
  }

  const { source, flags } = handler.pattern;

  return {
    ...handler,
    pattern: new RegExp(
      String.raw`(?<=${yearPattern}.*|^(?!.*${yearPattern}).*)(?:${source})`,
      flags,
    ),
  };
}

/**
 * The channels handlers must run before the year handlers,
 * as the year is removed from the title once it has been parsed.
 */
const channelsHandlers = [
  {
    field: "channels",
    pattern: /\+?2[.\s]0(?:x[2-4])?\b/iu,
    transform: transforms.toValueSet("2.0"),
    remove: true,
    keepMatching: true,
  },
  ...defaultHandlers.filter(({ field }) => field === "channels"),
].map(matchChannelsAfterYear);

const nonChannelsDefaultHandlers = defaultHandlers.filter(
  ({ field }) => field !== "channels",
);

const parser = new Parser()
  .addHandlers(adultHandlers)
  .addHandlers(sceneHandlers)
  .addHandlers(trashHandlers)
  .addHandlers(channelsHandlers)
  .addHandlers([
    {
      field: "complete",
      pattern:
        /(?:\bthe\W)?(?:\bcomplete\b|\bfull\b|\ball\b)\b.*\b(?:series|seasons|collection|episodes|set|pack|movies)\b/iu,
      transform: transforms.toBoolean(),
      remove: true,
    },
  ])
  .addHandlers(nonChannelsDefaultHandlers)
  .addHandlers([
    {
      field: "episodes",
      process: (title, meta, result) => {
        const animePattern = /One.*?Piece|Bleach|Naruto/u;

        if (animePattern.test(title)) {
          if (result.has("episodes")) {
            return meta;
          }

          const episodePattern = /\b\d{1,4}\b/u;
          const matches = episodePattern.exec(title);

          if (matches) {
            meta.value = [Math.trunc(Number(matches[0]))];
            meta.mIndex = matches.index;
            meta.remove = true;
          }
        }

        return meta;
      },
    },
  ])
  .addHandlers([
    {
      field: "bitrate",
      pattern: /\b\d+[kmg]bps\b/iu,
      matchGroup: 1,
      remove: true,
      transform: transforms.toLowercase(),
    },
    {
      field: "site",
      pattern: /rarbg|torrentleech|(?:the)?piratebay/iu,
      remove: true,
    },
  ]);

/**
 * The parser replaces all dots with spaces in dot-separated titles,
 * which breaks up version-like numbers that are part of the title (e.g. "M3GAN.2.0" becomes "M3GAN 2 0").
 *
 * This restores any single-digit decimals (in the style of audio channels) that appeared in the raw title.
 */
function restoreDecimalNumbers(title: string, rawTitle: string) {
  return title.replaceAll(
    /\b(?<integer>\d) (?<fraction>\d)\b/gu,
    (match, integer: string, fraction: string) => {
      const decimal = `${integer}.${fraction}`;

      return rawTitle.includes(decimal) ? decimal : match;
    },
  );
}

export function parse(rawTitle: string) {
  if (!rawTitle || typeof rawTitle !== "string") {
    throw new TypeError("The input title must be a non-empty string.");
  }

  const result = parser.parse(rawTitle);

  const parsedData = ParsedDataSchema.safeParse({
    ...result,
    title: result.title && restoreDecimalNumbers(result.title, rawTitle),
    rawTitle,
  });

  if (!parsedData.success) {
    parsedData.error.message = `Failed to parse ${rawTitle}: ${z.prettifyError(parsedData.error)}`;

    throw parsedData.error;
  }

  return parsedData.data;
}

/**
 * An experimental function that attempts to parse torrent data from an individual file's path within the torrent, rather than the overall torrent title.
 *
 * @param filePath The file path to parse, e.g. /Season 01/Episode 01.mkv
 * @returns Parsed data extracted from the file path parts, e.g. { seasons: [1], episodes: [1] }
 */
export function parseFilePath(filePath: string) {
  const parts = filePath.split("/").filter(Boolean);

  if (parts.length === 0) {
    throw new TypeError(
      "The input file path must contain at least one segment.",
    );
  }

  const parseData = {} as ParsedData;

  for (const part of parts) {
    try {
      merge(parseData, parse(part));
    } catch {
      // Continue to next part
    }
  }

  const parsedData = ParsedDataSchema.safeParse({
    ...parseData,
    rawTitle: filePath,
  });

  if (!parsedData.success) {
    parsedData.error.message = `Failed to parse ${filePath}: ${z.prettifyError(parsedData.error)}`;

    throw parsedData.error;
  }

  return parsedData.data;
}
