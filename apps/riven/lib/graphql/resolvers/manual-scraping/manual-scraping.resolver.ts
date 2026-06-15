import assert from "node:assert";
import { Arg, Ctx, Mutation, Resolver } from "type-graphql";

import { CoreContext } from "../../decorators/core-context.ts";
import { StartManualScrapeInput } from "./inputs/start-manual-scrape.input.ts";

import type { ApolloServerContext } from "../../context.ts";

@Resolver()
export class ManualScrapingResolver {
  @Mutation(() => Boolean)
  async startManualScrape(
    @CoreContext() { services }: CoreContext,
    @Ctx() { logger }: ApolloServerContext,
    @Arg("input", () => StartManualScrapeInput) input: StartManualScrapeInput,
  ) {
    const { enqueueManualScrape } =
      await import("../../../message-queue/flows/manual-scrape/enqueue-manual-scrape.ts");

    const [stream] = await services.downloaderService.findMatchingStreams([
      input.infoHash,
    ]);

    assert(stream);

    logger.info("Starting manual scrape...", input);

    const { enqueue } = await enqueueManualScrape({
      id: input.mediaItemId,
      stream,
    });

    await enqueue();

    return true;
  }
}
