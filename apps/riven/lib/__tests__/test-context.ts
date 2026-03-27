/* eslint-disable no-empty-pattern */
import { wrap } from "@mikro-orm/core";
import { Job, type JobsOptions } from "bullmq";
import { MockAgent, setGlobalDispatcher } from "undici";
import { expect, test as testBase } from "vitest";

import { database } from "../database/database.ts";
import { EpisodeFactory } from "../database/factories/episode.factory.ts";
import { ItemRequestFactory } from "../database/factories/item-request.factory.ts";
import { MediaEntryFactory } from "../database/factories/media-entry.factory.ts";
import { MovieFactory } from "../database/factories/movie.factory.ts";
import { SeasonFactory } from "../database/factories/season.factory.ts";
import { ShowFactory } from "../database/factories/show.factory.ts";
import { StreamFactory } from "../database/factories/stream.factory.ts";
import { createQueue } from "../message-queue/utilities/create-queue.ts";
import { buildSeederFunctions } from "./utilities/build-seeder-functions.ts";

export const rivenTestContext = testBase
  .extend("apolloServerInstance", async ({}) => {
    const { buildMockServer } =
      await import("@repo/core-util-mock-graphql-server");

    return buildMockServer();
  })
  .extend("gqlServer", async ({ apolloServerInstance }, { onCleanup }) => {
    await apolloServerInstance.start();

    onCleanup(() => apolloServerInstance.stop());

    return apolloServerInstance;
  })
  .extend("server", async ({}, { onCleanup }) => {
    const { setupServer } = await import("msw/node");

    const server = setupServer();

    if (/^(\*|msw)/.test(process.env["DEBUG"] ?? "")) {
      server.events.on("response:mocked", ({ request, response }) => {
        console.log(
          "%s %s received %s %s",
          request.method,
          request.url,
          response.status,
          response.statusText,
        );
      });
    }

    // Start the worker before the test.
    server.listen({
      onUnhandledRequest: "error",
    });

    onCleanup(() => {
      // Remove any request handlers added in individual test cases.
      // This prevents them from affecting unrelated tests.
      server.resetHandlers();

      // Stop the worker after the test.
      server.close();
    });

    // Expose the worker object on the test's context.
    return server;
  })
  .extend("mockAgent", ({}, { onCleanup }) => {
    const mockAgent = new MockAgent();

    mockAgent.disableNetConnect();

    setGlobalDispatcher(mockAgent);

    onCleanup(() => mockAgent.close());

    return mockAgent;
  })
  .extend("em", () => database.em.fork())
  .extend("orm", () => database.orm)
  .extend("factories", ({ em }) => ({
    itemRequestFactory: new ItemRequestFactory(em),
    movieFactory: new MovieFactory(em),
    showFactory: new ShowFactory(em),
    seasonFactory: new SeasonFactory(em),
    episodeFactory: new EpisodeFactory(em),
    streamFactory: new StreamFactory(em),
    mediaEntryFactory: new MediaEntryFactory(em),
  }))
  .extend("stream", ({ factories }) => factories.streamFactory.createOne())
  .extend("mediaEntry", ({ factories }) =>
    factories.mediaEntryFactory.makeOne({
      downloadUrl: "http://example.com/file.mp4",
      originalFilename: "file.mp4",
      plugin: "@repo/plugin-test",
    }),
  )
  .extend("seeders", ({ em }) => buildSeederFunctions(em))
  .extend("indexedMovie", async ({ seeders }) => seeders.seedIndexedMovie())
  .extend("scrapedMovie", async ({ seeders }) => seeders.seedScrapedMovie())
  .extend("completedMovie", async ({ seeders }) => seeders.seedCompletedMovie())
  .extend("indexedShow", async ({ seeders }) => seeders.seedIndexedShow())
  .extend("scrapedShow", async ({ seeders }) => seeders.seedScrapedShow())
  .extend("completedShow", async ({ seeders }) => seeders.seedCompletedShow())
  .extend("season", async ({ indexedShow }) => {
    await wrap(indexedShow).populate(["seasons"]);

    expect.assert(indexedShow.seasons[0]);

    return indexedShow.seasons[0];
  })
  .extend("episode", async ({ season }) => {
    await wrap(season).populate(["episodes"]);

    expect.assert(season.episodes[0]);

    return season.episodes[0];
  })
  .extend("mockQueue", ({}, { onCleanup }) => {
    const queue = createQueue("mock-queue");

    onCleanup(() => queue.close());

    return queue;
  })
  .extend(
    "createMockJob",
    ({ mockQueue }) =>
      <T>(data: T, opts?: JobsOptions) =>
        Job.create(mockQueue, crypto.randomUUID(), data, opts),
  );
