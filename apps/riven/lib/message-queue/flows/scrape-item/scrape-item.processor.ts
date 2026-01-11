import { persistScrapeResults } from "../../../state-machines/main-runner/actors/persist-scrape-results.actor.ts";
import { scrapeItemProcessorSchema } from "./scrape-item.schema.ts";

export const scrapeItemProcessor = scrapeItemProcessorSchema.implementAsync(
  async function (job, sendEvent) {
    const children = await job.getChildrenValues();

    const aggregatedResults = Object.values(children).reduce(
      (acc, scrapeResult) => ({
        ...acc,
        ...scrapeResult,
      }),
      {},
    );

    await persistScrapeResults({
      id: job.data.id,
      results: aggregatedResults,
      sendEvent,
    });

    return {
      success: true,
    };
  },
);
