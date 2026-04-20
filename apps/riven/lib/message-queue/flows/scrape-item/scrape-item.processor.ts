import { MediaItemScrapeError } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.event";
import { MediaItemScrapeErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.incorrect-state.event";
import { MediaItemScrapeErrorNoNewStreams } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.no-new-streams.event";

import { UnrecoverableError } from "bullmq";

import { scrapeItemProcessorSchema } from "./scrape-item.schema.ts";

import type { ParsedData } from "@repo/util-rank-torrent-name";

export const scrapeItemProcessor = scrapeItemProcessorSchema.implementAsync(
  async function ({ job }, { sendEvent, services }) {
    const children = await job.getChildrenValues();

    const parsedResults = Object.values(children).reduce<
      Record<string, ParsedData>
    >((acc, scrapeResult) => Object.assign(acc, scrapeResult.results), {});

    try {
      const { item } = await services.scraperService.scrapeItem(
        job.data.id,
        parsedResults,
      );

      sendEvent({
        type: "riven.media-item.scrape.success",
        item,
      });
    } catch (error) {
      if (
        error instanceof MediaItemScrapeErrorIncorrectState ||
        error instanceof MediaItemScrapeError
      ) {
        sendEvent(error.payload);

        throw new UnrecoverableError(error.message);
      }

      if (error instanceof MediaItemScrapeErrorNoNewStreams) {
        sendEvent(error.payload);
      }

      throw error;
    }
  },
);
