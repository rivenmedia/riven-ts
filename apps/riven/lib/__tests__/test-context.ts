/* eslint-disable no-empty-pattern */
import { startStandaloneServer } from "@apollo/server/standalone";
import * as Sentry from "@sentry/node";
import { Job, type JobsOptions } from "bullmq";
import { toMerged } from "es-toolkit";
import assert from "node:assert";
import { randomUUID } from "node:crypto";
import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from "undici";
import { test as testBase, vi } from "vitest";

import { database } from "../database/database.ts";
import { EpisodeFactory } from "../database/factories/episode.factory.ts";
import { MediaEntryFactory } from "../database/factories/media-entry.factory.ts";
import { MovieItemRequestFactory } from "../database/factories/movie-item-request.factory.ts";
import { MovieFactory } from "../database/factories/movie.factory.ts";
import { SeasonFactory } from "../database/factories/season.factory.ts";
import { ShowItemRequestFactory } from "../database/factories/show-item-request.factory.ts";
import { ShowFactory } from "../database/factories/show.factory.ts";
import { StreamFactory } from "../database/factories/stream.factory.ts";
import { initApolloClient } from "../graphql/apollo-client.ts";
import { resolvers } from "../graphql/resolvers/index.ts";
import { createQueue } from "../message-queue/utilities/create-queue.ts";
import { buildSeederFunctions } from "./utilities/build-seeder-functions.ts";

import type { ApolloServerContext } from "@repo/core-util-graphql-schema";

export const it = testBase
  .extend("server", { auto: false }, async ({}, { onCleanup }) => {
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
    movieItemRequestFactory: new MovieItemRequestFactory(em),
    movieFactory: new MovieFactory(em),
    showItemRequestFactory: new ShowItemRequestFactory(em),
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
        Job.create(mockQueue, randomUUID(), data, opts),
  )
  .extend("mockSentryScope", () => new Sentry.Scope())
  .extend("apolloServerInstance", { scope: "file" }, async ({}) => {
    const { buildMockServer } =
      await import("@repo/core-util-mock-graphql-server");

    return buildMockServer(resolvers);
  })
  .extend(
    "gqlServer",
    { scope: "file" },
    async ({ apolloServerInstance }, { onCleanup }) => {
      const { url } = await startStandaloneServer<ApolloServerContext>(
        apolloServerInstance,
        {
          context: () =>
            Promise.resolve({
              em: database.em.fork(),
            }),
          listen: { port: 0 },
        },
      );

      initApolloClient(new URL(url));

      vi.doMock(import("node:worker_threads"), async (importOriginal) => {
        const originalModule = await importOriginal();

        return toMerged(originalModule, {
          workerData: {
            gqlUrl: url,
          },
        });
      });

      onCleanup(() => apolloServerInstance.stop());

      return apolloServerInstance;
    },
  );

it.afterEach(({ mockSentryScope }) => {
  mockSentryScope.clear();
});
