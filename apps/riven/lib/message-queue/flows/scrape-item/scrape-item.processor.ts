import { MediaItemScrapeError } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.event";
import { MediaItemScrapeErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.incorrect-state.event";

import { UnrecoverableError } from "bullmq";

import { scrapeItemProcessorSchema } from "./scrape-item.schema.ts";
import { persistScrapeResults } from "./utilities/persist-scrape-results.actor.ts";

import type { RankedResult } from "@repo/util-rank-torrent-name";

export const scrapeItemProcessor = scrapeItemProcessorSchema.implementAsync(
  async function (job, sendEvent) {
    const children = await job.getChildrenValues();

    const sortedResults = Object.values(children).reduce<RankedResult[]>(
      (acc, scrapeResult) => {
        if (!scrapeResult.success) {
          return acc;
        }

        return [...acc, ...scrapeResult.result.results];
      },
      [],
    );

    try {
      const item = await persistScrapeResults({
        id: job.data.id,
        results: sortedResults,
      });

      sendEvent({
        type: "riven.media-item.scrape.success",
        item,
      });

      return {
        success: true,
      };
    } catch (error) {
      if (
        error instanceof MediaItemScrapeErrorIncorrectState ||
        error instanceof MediaItemScrapeError
      ) {
        sendEvent(error.payload);

        throw new UnrecoverableError(error.message);
      }

      throw error;
    }
  },
);
