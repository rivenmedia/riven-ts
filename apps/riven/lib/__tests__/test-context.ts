import { DataSourceMap } from "@repo/util-plugin-sdk";

import { graphql, passthrough } from "msw";
import assert from "node:assert";
import { randomUUID } from "node:crypto";
import { type Mock, test as testBase, vi } from "vitest";

import { type ApolloServerContext, CoreKey } from "../graphql/context.ts";
import { queueNameFor } from "../message-queue/utilities/queue-name-for.ts";

import type { Services } from "../database/database.ts";
import type { Flow } from "../message-queue/flows/index.ts";
import type { SandboxedJobDefinition } from "../message-queue/sandboxed-jobs/index.ts";
import type { ValidPlugin, ValidPluginMap } from "../types/plugins.ts";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";
import type { JobsOptions, Processor, Queue, Worker } from "bullmq";
import type { ZodObject } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;

export const it = testBase
  .extend("server", { auto: true }, async ({}, { onCleanup }) => {
    const { setupServer } = await import("msw/node");

    const server = setupServer(
      graphql.query(
        ({ request: { url } }) => url.includes("localhost"),
        passthrough,
      ),
    );

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
  .extend("mockAgent", async ({}, { onCleanup }) => {
    const { MockAgent, getGlobalDispatcher, setGlobalDispatcher } =
      await import("undici");

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
  .extend("orm", { scope: "file" }, async () => {
    const { database } = await import("../database/database.ts");

    return database.orm;
  })
  .extend("services", { scope: "file" }, async () => {
    const { services } = await import("../database/database.ts");

    return services;
  })
  .extend("em", ({ orm }) => orm.em.fork())
  .extend("factories", async ({ em }) => {
    const { EpisodeFactory } =
      await import("../database/factories/episode.factory.ts");
    const { MediaEntryFactory } =
      await import("../database/factories/media-entry.factory.ts");
    const { MovieItemRequestFactory } =
      await import("../database/factories/movie-item-request.factory.ts");
    const { MovieFactory } =
      await import("../database/factories/movie.factory.ts");
    const { SeasonFactory } =
      await import("../database/factories/season.factory.ts");
    const { ShowItemRequestFactory } =
      await import("../database/factories/show-item-request.factory.ts");
    const { ShowFactory } =
      await import("../database/factories/show.factory.ts");
    const { StreamFactory } =
      await import("../database/factories/stream.factory.ts");

    return {
      movieItemRequestFactory: new MovieItemRequestFactory(em),
      movieFactory: new MovieFactory(em),
      showItemRequestFactory: new ShowItemRequestFactory(em),
      showFactory: new ShowFactory(em),
      seasonFactory: new SeasonFactory(em),
      episodeFactory: new EpisodeFactory(em),
      streamFactory: new StreamFactory(em),
      mediaEntryFactory: new MediaEntryFactory(em),
    };
  })
  .extend("stream", ({ factories }) => factories.streamFactory.createOne())
  .extend("mediaEntry", ({ factories }) =>
    factories.mediaEntryFactory.makeOne({
      downloadUrl: "http://example.com/file.mp4",
      originalFilename: "file.mp4",
      plugin: "@repo/plugin-test",
    }),
  )
  .extend("seeders", async ({ em }) => {
    const { buildSeederFunctions } =
      await import("./utilities/build-seeder-functions.ts");

    return buildSeederFunctions(em);
  })
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
  .extend(
    "episode",
    ({
      indexedShowContext: {
        episodes: [episode],
      },
    }) => {
      assert(episode);

      return episode;
    },
  )
  .extend("mockQueue", async ({ task }, { onCleanup }) => {
    const { createQueue } =
      await import("../message-queue/utilities/create-queue.ts");

    const queue = createQueue(`mock-queue-${task.id}`);

    onCleanup(() => queue.close());

    return queue;
  })
  .extend("createMockJob", async ({ mockQueue }) => {
    const { randomUUID } = await import("node:crypto");
    const { Job } = await import("bullmq");

    return async <T>(data: T, opts?: JobsOptions) => {
      const job = await Job.create(mockQueue, randomUUID(), data, opts);

      vi.spyOn(job, "log").mockResolvedValue(1);

      return job;
    };
  })
  .extend(
    "mockFlowProcessorContext",
    async ({
      services,
    }): Promise<{
      services: Services;
      sendEvent: Mock;
      plugins: ValidPluginMap;
    }> => {
      const { default: testPlugin } = await import("@repo/plugin-test");

      return {
        services,
        sendEvent: vi.fn(),
        plugins: new Map<symbol, ValidPlugin>([
          [
            testPlugin.name,
            {
              config: testPlugin,
              dataSources: new DataSourceMap(),
              status: "valid",
            },
          ],
        ]),
      };
    },
  )
  .extend("mockSentryScope", async () => {
    const Sentry = await import("@sentry/node");

    return new Sentry.Scope();
  })
  .extend("apolloServerInstance", { scope: "file" }, async () => {
    const { buildMockServer } =
      await import("@repo/core-util-mock-graphql-server");
    const { resolvers } = await import("../graphql/resolvers/index.ts");

    return buildMockServer<ApolloServerContext>(resolvers);
  })
  .extend(
    "gqlServer",
    { scope: "file" },
    async ({ apolloServerInstance, orm, services }, { onCleanup }) => {
      const { initApolloClient } = await import("../graphql/apollo-client.ts");
      const { startStandaloneServer } =
        await import("@apollo/server/standalone");

      const { url } = await startStandaloneServer<ApolloServerContext>(
        apolloServerInstance,
        {
          context: () =>
            Promise.resolve({
              [CoreKey]: {
                em: orm.em.fork(),
                services,
              },
              logger: {} as never,
              sendEvent: vi.fn(),
              plugins: {},
            }),
          listen: { port: 0 },
        },
      );

      initApolloClient(new URL(url));

      onCleanup(async () => {
        await apolloServerInstance.stop();
      });

      return apolloServerInstance;
    },
  )
  .extend(
    "apolloClient",
    { scope: "file" },
    await import("../graphql/apollo-client.ts"),
  )
  .extend("createFlowWorker", async ({}, { onCleanup }) => {
    const { createFlowWorker } =
      await import("../message-queue/utilities/create-flow-worker.ts");

    const workers = new Set<Worker>();
    const queues = new Set<Queue>();

    onCleanup(async () => {
      for (const worker of workers) {
        await worker.close();
      }

      for (const queue of queues) {
        await queue.close();
      }
    });

    return (flowSchema: ZodObject, processor: AnyFunction) => {
      const { queue, worker } = createFlowWorker(
        flowSchema as never,
        processor as never,
        vi.fn(),
        new Map(),
      );

      workers.add(worker);
      queues.add(queue);

      return { queue, worker };
    };
  })
  .extend("createPluginWorker", async ({}, { onCleanup }) => {
    const { createPluginWorker } =
      await import("../message-queue/utilities/create-plugin-worker.ts");

    const workers = new Set<Worker>();
    const queues = new Set<Queue>();

    onCleanup(async () => {
      for (const worker of workers) {
        await worker.close();
      }

      for (const queue of queues) {
        await queue.close();
      }
    });

    return (
      eventType: RivenEvent["type"],
      pluginName: string,
      processor: Processor,
    ) => {
      const { queue, worker } = createPluginWorker(
        eventType,
        pluginName,
        processor,
      );

      workers.add(worker);
      queues.add(queue);

      return { queue, worker };
    };
  })
  .extend(
    "createMockJobChildKey",
    () =>
      (
        eventName: Flow["name"] | SandboxedJobDefinition["name"],
        pluginName?: string,
      ) =>
        `bull:${queueNameFor(eventName, pluginName)}:${randomUUID()}` as const,
  );

it.afterEach(async ({ mockSentryScope, apolloClient }) => {
  mockSentryScope.clear();

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (apolloClient.client) {
    await apolloClient.client.clearStore();
  }
});
