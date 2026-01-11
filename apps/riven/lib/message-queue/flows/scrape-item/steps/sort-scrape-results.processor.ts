import { UnrecoverableError } from "bullmq";
import { type DefaultParserResult, parse } from "parse-torrent-title";

import { sortScrapeResultsProcessorSchema } from "./sort-scrape-results.schema.ts";

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
      Record<string, DefaultParserResult>
    >((acc, [infoHash, title]) => {
      const parseResult = parse(title || "");

      acc[infoHash] = parseResult;

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
