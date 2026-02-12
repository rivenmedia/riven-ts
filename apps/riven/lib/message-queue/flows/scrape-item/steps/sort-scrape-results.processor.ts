import {
  type RankedResult,
  createSettings,
  rankTorrent,
} from "@repo/util-rank-torrent-name";

import { UnrecoverableError } from "bullmq";

import { sortScrapeResultsProcessorSchema } from "./sort-scrape-results.schema.ts";

const rankingSettings = createSettings({
  languages: {
    required: ["en"],
  },
});

export const sortScrapeResultsProcessor =
  sortScrapeResultsProcessorSchema.implementAsync(async function (job) {
    const children = await job.getChildrenValues();

    const childResults = Object.values(children);

    const aggregatedResults = childResults.reduce<Record<string, string>>(
      (acc, scrapeResult) => ({
        ...acc,
        ...scrapeResult.results,
      }),
      {},
    );

    if (!Object.keys(aggregatedResults).length) {
      throw new UnrecoverableError(`No streams found for ${job.data.title}`);
    }

    const parsedResults = Object.entries(aggregatedResults).reduce<
      Record<string, RankedResult>
    >((acc, [infoHash, title]) => {
      const rank = rankTorrent(title, rankingSettings);

      if (!rank.fetch) {
        return acc;
      }

      console.log(rank);

      acc[infoHash] = rank;

      return acc;
    }, {});

    return {
      success: true,
      result: {
        id: job.data.id,
        results: parsedResults,
      },
    };
  });
