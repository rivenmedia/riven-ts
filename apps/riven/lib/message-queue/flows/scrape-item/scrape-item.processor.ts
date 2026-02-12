import { UnrecoverableError } from "bullmq";

import { persistScrapeResults } from "../../../state-machines/main-runner/actors/persist-scrape-results.actor.ts";
import { scrapeItemProcessorSchema } from "./scrape-item.schema.ts";

import type { RankedResult } from "@repo/util-rank-torrent-name";

export const scrapeItemProcessor = scrapeItemProcessorSchema.implementAsync(
  async function (job, sendEvent) {
    const children = await job.getChildrenValues();

    const sortedResults = Object.values(children).reduce<
      Record<string, RankedResult>
    >((acc, scrapeResult) => {
      if (!scrapeResult.success) {
        return acc;
      }

      return {
        ...acc,
        ...scrapeResult.result.results,
      };
    }, {});

    try {
      const item = await persistScrapeResults({
        id: job.data.id,
        results: sortedResults,
        sendEvent,
      });

      if (item) {
        sendEvent({
          type: "riven.media-item.scrape.success",
          item,
        });
      }

      return {
        success: true,
      };
    } catch (error) {
      throw new UnrecoverableError(
        `Failed to persist scrape results: ${String(error)}`,
      );
    }
  },
);
