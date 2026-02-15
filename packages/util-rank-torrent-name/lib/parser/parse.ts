import { Parser, transforms } from "@viren070/parse-torrent-title";
import { prettifyError } from "zod";

import { sceneHandlers } from "../parser/handlers/scene.handlers.ts";
import { trashHandlers } from "../parser/handlers/trash.handlers.ts";
import { ParsedDataSchema } from "../schemas.ts";
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
    throw new Error(
      `Failed to parse ${rawTitle}: ${prettifyError(parsedData.error)}`,
    );
  }

  return parsedData.data;
}
