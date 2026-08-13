import { DataSourceMap } from "@repo/util-plugin-sdk";

import { graphql, passthrough } from "msw";
import assert from "node:assert";
import { randomUUID } from "node:crypto";
import { test as testBase, vi } from "vitest";

import { CoreKey } from "../graphql/context.ts";
import { queueNameFor } from "../message-queue/utilities/queue-name-for.ts";
import { logger } from "../utilities/logger/logger.ts";

import type { Services } from "../database/database.ts";
import type { ApolloServerContext } from "../graphql/context.ts";
import type { Flow } from "../message-queue/flows/index.ts";
import type { SandboxedJobDefinition } from "../message-queue/sandboxed-jobs/index.ts";
import type { MainRunnerMachineIntake } from "../state-machines/main-runner/index.ts";
import type { ValidPlugin, ValidPluginMap } from "../types/plugins.ts";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";
import type { JobsOptions, Processor, Queue, Worker } from "bullmq";
import type { Mock } from "vitest";
import type { ZodObject } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;

export const it = testBase
  .extend(
    "applicationContext",
    { scope: "file" },
    async ({}, { onCleanup }) => {
      const { Test } = await import("@nestjs/testing");
      const { AppModule } = await import("../app.module.ts");

      const module = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      onCleanup(async () => {
        await module.close();
      });

      return module;
    },
  )
  .extend("server", { auto: true }, async ({}, { onCleanup }) => {
    const { setupServer } = await import("msw/node");

    const server = setupServer(
      graphql.query(
        ({ request: { url } }) => url.includes("localhost"),
        passthrough,
      ),
    );

    if (/^(\*|msw)/u.test(process.env["DEBUG"] ?? "")) {
      server.events.on("response:mocked", ({ request, response }) => {
        console.debug(
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
  // Resolved through the container so that fixtures and the code under test
  // share one instance: stubbing a service here must be visible to the
  // resolvers that receive it by injection.
  .extend("orm", { scope: "file" }, async ({ applicationContext }) => {
    const { MikroORM } = await import("@mikro-orm/core");

    return applicationContext.get(MikroORM);
  })
  .extend("services", { scope: "file" }, async ({ applicationContext }) => {
    const { DownloaderService } =
      await import("../database/services/downloader/downloader.service.ts");
    const { IndexerService } =
      await import("../database/services/indexer/indexer.service.ts");
    const { ItemRequestService } =
      await import("../database/services/item-request/item-request.service.ts");
    const { MediaEntryService } =
      await import("../database/services/media-entry/media-entry.service.ts");
    const { MediaItemService } =
      await import("../database/services/media-item/media-item.service.ts");
    const { PostProcessingService } =
      await import("../database/services/post-processing/post-processing.service.ts");
    const { RetryLibraryService } =
      await import("../database/services/retry-library/retry-library.service.ts");
    const { ScraperService } =
      await import("../database/services/scraper/scraper.service.ts");
    const { StreamService } =
      await import("../database/services/stream/stream.service.ts");
    const { SubtitlesService } =
      await import("../database/services/subtitles/subtitles.service.ts");
    const { VfsService } =
      await import("../database/services/vfs/vfs.service.ts");

    return {
      downloaderService: applicationContext.get(DownloaderService),
      indexerService: applicationContext.get(IndexerService),
      itemRequestService: applicationContext.get(ItemRequestService),
      mediaEntryService: applicationContext.get(MediaEntryService),
      mediaItemService: applicationContext.get(MediaItemService),
      postProcessingService: applicationContext.get(PostProcessingService),
      retryLibraryService: applicationContext.get(RetryLibraryService),
      scraperService: applicationContext.get(ScraperService),
      streamService: applicationContext.get(StreamService),
      subtitlesService: applicationContext.get(SubtitlesService),
      vfsService: applicationContext.get(VfsService),
    };
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
  .extend("stream", async ({ factories }) =>
    factories.streamFactory.createOne(),
  )
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
      assert.ok(season);

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
      assert.ok(episode);

      return episode;
    },
  )
  .extend("mockQueue", async ({ task }, { onCleanup }) => {
    const { createQueue } =
      await import("../message-queue/utilities/create-queue.ts");

    const queue = createQueue(`mock-queue-${task.id}`);

    onCleanup(async () => queue.close());

    return queue;
  })
  .extend("createMockJob", async ({ mockQueue }) => {
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
      sendEvent: Mock<MainRunnerMachineIntake>;
      plugins: ValidPluginMap;
    }> => {
      const { plugin: testPlugin } = await import("@repo/plugin-test");

      return {
        services,
        sendEvent: vi.fn<MainRunnerMachineIntake>(),
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
  .extend(
    "apolloServerInstance",
    { scope: "file" },
    async ({ applicationContext }) => {
      const { buildMockServer } =
        await import("@repo/core-util-mock-graphql-server");
      const { createNestContainer } =
        await import("../graphql/nest-container.ts");
      const { resolvers } = await import("../graphql/resolvers/index.ts");

      return buildMockServer<ApolloServerContext>(resolvers, {
        container: createNestContainer(applicationContext),
      });
    },
  )
  .extend("createGqlContext", { scope: "file" }, ({ services, orm }) => () => ({
    [CoreKey]: {
      em: orm.em.fork(),
      services,
      sendEvent: vi.fn<MainRunnerMachineIntake>(),
    },
    logger,
    sendEvent: vi.fn<MainRunnerMachineIntake>(),
    plugins: {},
  }))
  .extend("gqlContext", ({ createGqlContext }) => createGqlContext())
  .extend(
    "gqlServer",
    { scope: "file" },
    async ({ apolloServerInstance, createGqlContext }, { onCleanup }) => {
      const { initApolloClient } = await import("../graphql/apollo-client.ts");
      const { startStandaloneServer } =
        await import("@apollo/server/standalone");

      const { url } = await startStandaloneServer<ApolloServerContext>(
        apolloServerInstance,
        {
          context: async () => Promise.resolve(createGqlContext()),
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
