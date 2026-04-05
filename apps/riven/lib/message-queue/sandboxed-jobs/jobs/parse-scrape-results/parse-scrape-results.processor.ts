import { UnrecoverableError } from "bullmq";

import { logger } from "../../../../utilities/logger/logger.ts";
import { createSandboxedJobProcessor } from "../../utilities/create-sandboxed-job.processor.ts";

import type { ParsedData } from "@repo/util-rank-torrent-name";

export default createSandboxedJobProcessor(
  "scrape-item.parse-scrape-results",
  async function ({ job }) {
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

    const { withORM } = await import("../../utilities/with-orm.ts");

    return withORM(async (database) => {
      const item = await database.mediaItem.findOneOrFail(job.data.id);
      const { fullTitle: itemTitle } = item;

      if (!Object.keys(aggregatedResults).length) {
        throw new UnrecoverableError(`No streams found for ${itemTitle}`);
      }

      const validResults = new Map<string, ParsedData>();

      const { parse } = await import("@repo/util-rank-torrent-name/parser");
      const { SkippedTorrentError, validateTorrent } =
        await import("./utilities/validate-torrent.ts");

      for (const [hash, rawTitle] of Object.entries(aggregatedResults)) {
        try {
          const parsedData = parse(rawTitle);

          await validateTorrent(item, itemTitle, parsedData, hash);

          validResults.set(hash, parsedData);
        } catch (error) {
          if (error instanceof SkippedTorrentError) {
            logger.silly(error.message);
          } else {
            logger.debug(
              `Failed to parse torrent ${rawTitle} (${hash}) for ${itemTitle}`,
              { err: error },
            );
          }
        }
      }

      return {
        id: job.data.id,
        results: Object.fromEntries(validResults),
      };
    });
  },
);
