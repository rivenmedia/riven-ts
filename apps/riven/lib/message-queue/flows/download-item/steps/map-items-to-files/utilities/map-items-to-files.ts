import { parse } from "@repo/util-rank-torrent-name";

import assert from "assert";

import type { MapItemsToFilesFlow } from "../map-items-to-files.schema.ts";
import type { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";

export function mapItemsToFiles(items: DebridFile[]) {
  return items.reduce<MapItemsToFilesFlow["output"]["files"]>(
    (acc, file) => {
      try {
        const parseData = parse(file.fileName);

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
