import { manualScrapeProcessorSchema } from "./manual-scrape.schema.ts";

export const manualScrapeProcessor = manualScrapeProcessorSchema.implementAsync(
  async function (
    { job, token },
    {
      services: {
        downloaderService,
        indexerService,
        scraperService,
        mediaItemService,
        postProcessingService,
      },
      plugins,
    },
  ) {
    const childrenValues = await job.getChildrenValues();

    console.log(childrenValues);
  },
);
