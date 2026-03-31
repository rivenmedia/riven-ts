import { UnrecoverableError } from "bullmq";

import { createSandboxedJobProcessor } from "../../../../utilities/create-sandboxed-job.processor.js";
import {
  ParseScrapeResultsSandboxedJob,
  parseScrapeResultsProcessorSchema,
} from "./parse-scrape-results.schema.ts";

import type { ParsedData } from "@repo/util-rank-torrent-name";

export default createSandboxedJobProcessor(
  ParseScrapeResultsSandboxedJob,
  parseScrapeResultsProcessorSchema.implementAsync(async function ({ job }) {
    const children = await job.getChildrenValues();

    const childResults = Object.values(children);

    // Aggregate results from all scrapers, deduping by hash (which should be consistent across scrapers)
    const aggregatedResults = childResults.reduce<Record<string, string>>(
      (acc, scrapeResult) => ({
        ...acc,
        ...scrapeResult.results,
      }),
      {},
    );

    const { withORM } = await import("../../../../utilities/with-orm.ts");
    const { parse } = await import("@repo/util-rank-torrent-name");
    const { SkippedTorrentError, validateTorrent } =
      await import("./utilities/validate-torrent.ts");
    const { logger } =
      await import("../../../../../utilities/logger/logger.ts");

    return withORM(async (database) => {
      const item = await database.mediaItem.findOneOrFail(job.data.id);
      const { fullTitle: itemTitle } = item;

      if (!Object.keys(aggregatedResults).length) {
        throw new UnrecoverableError(`No streams found for ${itemTitle}`);
      }

      const parsedResults = await Promise.all(
        Object.entries(aggregatedResults).map(async ([hash, rawTitle]) => {
          try {
            const parsedData = parse(rawTitle);

            await validateTorrent(item, itemTitle, parsedData, hash);

            return [hash, parsedData] as const;
          } catch (error) {
            if (error instanceof SkippedTorrentError) {
              logger.silly(error.message);
            } else {
              logger.debug(
                `Failed to parse torrent ${rawTitle} (${hash}) for ${itemTitle}`,
                { err: error },
              );
            }

            return [hash, null] as const;
          }
        }),
      );

      const validResults = Object.fromEntries(
        parsedResults.filter(
          (entry): entry is [string, ParsedData] => entry[1] !== null,
        ),
      );

      return {
        id: job.data.id,
        title: itemTitle,
        results: validResults,
      };
    });
  }),
);
