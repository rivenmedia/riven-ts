/* eslint-disable no-empty-pattern */
import * as Sentry from "@sentry/node";
import { Job, type JobsOptions } from "bullmq";
import assert from "node:assert";
import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from "undici";
import { test as testBase } from "vitest";

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

export const it = testBase
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
    const previousGlobalDispatcher = getGlobalDispatcher();

    mockAgent.disableNetConnect();

    setGlobalDispatcher(mockAgent);

    onCleanup(async () => {
      await mockAgent.close();

      setGlobalDispatcher(previousGlobalDispatcher);
    });

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
  .extend("seeders", ({ em, orm }) => buildSeederFunctions(orm, em))
  .extend("indexedMovieContext", async ({ seeders }) => {
    const result = await seeders.seedIndexedMovie();

    return {
      indexedMovie: result.movie,
    };
  })
  .extend("scrapedMovieContext", async ({ seeders }) => {
    const result = await seeders.seedScrapedMovie();

    return {
      scrapedMovie: result.movie,
      streams: result.streams,
    };
  })
  .extend("completedMovieContext", async ({ seeders }) => {
    const result = await seeders.seedCompletedMovie();

    return {
      completedMovie: result.movie,
      streams: result.streams,
    };
  })
  .extend("indexedShowContext", async ({ seeders }) => {
    const result = await seeders.seedIndexedShow();

    return {
      indexedShow: result.show,
      seasons: result.seasons ?? [],
      episodes: result.episodes ?? [],
    };
  })
  .extend("scrapedShowContext", async ({ seeders }) => {
    const result = await seeders.seedScrapedShow();

    return {
      scrapedShow: result.show,
      streams: result.streams,
      seasons: result.seasons ?? [],
      episodes: result.episodes ?? [],
    };
  })
  .extend("completedShowContext", async ({ seeders }) => {
    const result = await seeders.seedCompletedShow();

    return {
      completedShow: result.show,
      streams: result.streams,
      seasons: result.seasons ?? [],
      episodes: result.episodes ?? [],
    };
  })
  .extend(
    "season",
    ({
      indexedShowContext: {
        seasons: [season],
      },
    }) => {
      assert(season);

      return season;
    },
  )
  .extend("episode", ({ indexedShowContext: { episodes: [episode] = [] } }) => {
    assert(episode);

    return episode;
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
  )
  .extend("mockSentryScope", () => new Sentry.Scope());
