import { ShowLikeMediaItem } from "@repo/util-plugin-sdk/dto/entities";
import { type ParsedData, parse } from "@repo/util-rank-torrent-name";

import { UnrecoverableError } from "bullmq";

import { database } from "../../../../../database/database.ts";
import { logger } from "../../../../../utilities/logger/logger.ts";
import { parseScrapeResultsProcessorSchema } from "./parse-scrape-results.schema.ts";
import {
  SkippedTorrentError,
  validateTorrent,
} from "./utilities/validate-torrent.ts";

export const parseScrapeResultsProcessor =
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

    const item = await database.mediaItem.findOneOrFail(job.data.id);
    const { title: itemTitle } =
      item instanceof ShowLikeMediaItem ? await item.getShow() : item;

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
            logger.error(
              `Failed to rank torrent ${rawTitle} (${hash}) for ${itemTitle}: ${
                (error as Error).message
              }`,
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
