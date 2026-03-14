import { parse } from "@repo/util-rank-torrent-name";

import assert from "assert";
import { extname } from "node:path";
import z from "zod";

import type { MapItemsToFilesFlow } from "../map-items-to-files.schema.ts";
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
  return items.reduce<MapItemsToFilesFlow["output"]>(
    (acc, file) => {
      try {
        const fileExtension = extname(file.name);

        assert(
          VALID_FILE_EXTENSIONS.safeParse(fileExtension).success,
          "Invalid file extension",
        );

        const parseData = parse(file.name);

        if (parseData.type === "movie") {
          return {
            ...acc,
            movies: {
              ...acc.movies,
              [Object.keys(acc.movies).length.toString()]: file,
            },
          };
        }

        const seasonNumber = parseData.seasons[0] ?? "abs";
        const episodeNumber = parseData.episodes[0];

        assert(episodeNumber, "Episode number is required for show files");

        const key = `${seasonNumber.toString()}:${episodeNumber.toString()}`;

        return {
          ...acc,
          episodes: {
            ...acc.episodes,
            [key]: file,
          },
        };
      } catch {
        return acc;
      }
    },
    {
      episodes: {},
      movies: {},
    },
  );
}
