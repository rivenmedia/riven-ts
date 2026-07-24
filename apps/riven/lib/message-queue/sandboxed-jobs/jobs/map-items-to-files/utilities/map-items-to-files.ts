import { parseFilePath } from "@repo/util-rank-torrent-name";

import assert from "node:assert";
import path from "node:path";
import z from "zod";

import { logger } from "../../../../../utilities/logger/logger.ts";

import type { MapItemsToFilesSandboxedJob } from "../map-items-to-files.schema.ts";
import type { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";

const VALID_FILE_EXTENSIONS = z.enum([
  ".mp4",
  ".mkv",
  ".avi",
  ".mov",
  ".wmv",
  ".flv",
  ".webm",
]);

export function mapItemsToFiles(items: DebridFile[]) {
  const acc: MapItemsToFilesSandboxedJob["output"] = {
    episodes: {},
    movies: {},
  };

  for (const file of items) {
    try {
      const fileExtension = path.extname(file.name);

      assert.ok(
        VALID_FILE_EXTENSIONS.safeParse(fileExtension).success,
        `Invalid file extension: ${fileExtension}`,
      );

      const parseData = parseFilePath(file.path);

      if (parseData.type === "movie") {
        acc.movies[Object.keys(acc.movies).length.toString()] = file;

        continue;
      }

      const seasonNumber = parseData.seasons[0] ?? "abs";
      const [episodeNumber] = parseData.episodes;

      assert.ok(episodeNumber, "Episode number is required for show files");

      const key = `${seasonNumber.toString()}:${episodeNumber.toString()}`;

      acc.episodes[key] = file;
    } catch (error) {
      logger.silly(`Error mapping file ${file.name}: ${String(error)}`);
    }
  }

  return acc;
}
