import { parse } from "@repo/util-rank-torrent-name";

import { UnrecoverableError } from "bullmq";
import assert from "node:assert";

import {
  type MapItemsToFilesFlow,
  mapItemsToFilesProcessorSchema,
} from "./map-items-to-files.schema.ts";

export const mapItemsToFilesProcessor =
  mapItemsToFilesProcessorSchema.implementAsync(async function ({ job }) {
    const [torrentContainer] = Object.values(await job.getChildrenValues());

    if (!torrentContainer) {
      throw new UnrecoverableError(
        "No valid torrent container found to map items to files",
      );
    }

    const parsedFiles = torrentContainer.files.reduce<
      MapItemsToFilesFlow["output"]["files"]
    >(
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

    return {
      ...torrentContainer,
      files: parsedFiles,
    };
  });
