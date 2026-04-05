import { Parser, transforms } from "@viren070/parse-torrent-title";
import { merge } from "es-toolkit";
import z from "zod";

import { sceneHandlers } from "../parser/handlers/scene.handlers.ts";
import { trashHandlers } from "../parser/handlers/trash.handlers.ts";
import { type ParsedData, ParsedDataSchema } from "../schemas.ts";
import { adultHandlers } from "./handlers/adult.handlers.ts";

const parser = new Parser()
  .addHandlers(adultHandlers)
  .addHandlers(sceneHandlers)
  .addHandlers(trashHandlers)
  .addHandlers([
    {
      field: "channels",
      pattern: new RegExp("\\+?2[\\.\\s]0(?:x[2-4])?\\b", "i"),
      transform: transforms.toValueSet("2.0"),
      remove: true,
      keepMatching: true,
    },
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
      process: (title, meta, result) => {
        const animePattern = new RegExp("One.*?Piece|Bleach|Naruto");

        if (animePattern.test(title)) {
          if (result.has("episodes")) {
            return meta;
          }

          const episodePattern = new RegExp("\\b\\d{1,4}\\b");
          const matches = episodePattern.exec(title);

          if (matches) {
            meta.value = [parseInt(matches[0], 10)];
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
      pattern: new RegExp("\\b\\d+[kmg]bps\\b", "i"),
      matchGroup: 1,
      remove: true,
      transform: transforms.toLowercase(),
    },
    {
      field: "site",
      pattern: new RegExp("rarbg|torrentleech|(?:the)?piratebay", "i"),
      remove: true,
    },
  ]);

export function parse(rawTitle: string) {
  if (!rawTitle || typeof rawTitle !== "string") {
    throw new TypeError("The input title must be a non-empty string.");
  }

  const parsedData = ParsedDataSchema.safeParse({
    ...parser.parse(rawTitle),
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

  const parseData = parts.reduce<ParsedData | null>((acc, part) => {
    try {
      const parsedPart = parse(part);

      return merge(acc ?? {}, parsedPart);
    } catch {
      return acc;
    }
  }, null);

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
