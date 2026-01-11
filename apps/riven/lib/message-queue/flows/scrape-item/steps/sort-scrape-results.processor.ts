import { logger } from "@repo/core-util-logger";

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
      throw new UnrecoverableError(
        `No streams found for item ${job.data.id.toString()}`,
      );
    }

    const parsedResults = Object.entries(aggregatedResults).reduce<
      Record<string, DefaultParserResult>
    >((acc, [infoHash, title]) => {
      const parseResult = parse(title || "");

      acc[infoHash] = parseResult;

      return acc;
    }, {});

    logger.info({ parsedResults });

    return {
      success: true,
      result: {
        id: job.data.id,
        results: parsedResults,
      },
    };
  });
