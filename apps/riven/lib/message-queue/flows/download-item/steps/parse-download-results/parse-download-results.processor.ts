import { parse } from "@repo/util-rank-torrent-name";

import { UnrecoverableError } from "bullmq";

import {
  type ParseDownloadResultsFlow,
  parseDownloadResultsProcessorSchema,
} from "./parse-download-results.schema.ts";

export const parseDownloadResultsProcessor =
  parseDownloadResultsProcessorSchema.implementAsync(async function ({ job }) {
    const parsedFiles = job.data.results.files.reduce<
      ParseDownloadResultsFlow["output"]
    >(
      (acc, file) => {
        try {
          const parseData = parse(file.fileName);

          if (parseData.type === "movie") {
            return {
              ...acc,
              movies: {
                ...acc.movies,
                [Object.keys(acc.movies).length.toString()]: {
                  file,
                  parseData,
                },
              },
            };
          }

          return {
            ...acc,
            episodes: {
              ...acc.episodes,
              [Object.keys(acc.episodes).length.toString()]: {
                file,
                parseData,
              },
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

    console.log(parsedFiles);

    return parsedFiles;
  });
