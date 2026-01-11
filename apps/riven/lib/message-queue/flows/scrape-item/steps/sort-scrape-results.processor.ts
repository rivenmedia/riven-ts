import { type DefaultParserResult, parse } from "parse-torrent-title";

import { sortScrapeResultsProcessorSchema } from "./sort-scrape-results.schema.ts";

export const sortScrapeResultsProcessor =
  sortScrapeResultsProcessorSchema.implementAsync(async function (job) {
    const children = await job.getChildrenValues();

    const aggregatedResults = Object.values(children).reduce<
      Record<string, string>
    >(
      (acc, scrapeResult) => ({
        ...acc,
        ...scrapeResult.results,
      }),
      {},
    );

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
