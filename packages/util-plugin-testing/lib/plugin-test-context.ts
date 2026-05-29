import {
  type BaseDataSource,
  type BaseDataSourceConfig,
  DataSourceMap,
  type RivenPlugin,
} from "@repo/util-plugin-sdk";

import { RedisConnection } from "bullmq";
import { it as baseIt, vi } from "vitest";

import { mockLogger } from "./create-mock-logger.ts";
import { createMockPluginSettings } from "./create-mock-plugin-settings.ts";

import type { GraphQLContext } from "@repo/util-plugin-sdk/types/graphql-context";
import type { Telemetry } from "bullmq";

export const it = baseIt
  .extend("server", { auto: true }, async ({}, { onCleanup }) => {
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

    server.listen({
      onUnhandledRequest: "error",
    });

    onCleanup(() => {
      server.close();
    });

    return server;
  })
  .extend("logger", { scope: "file" }, mockLogger)
  .extend<"plugin", RivenPlugin>("plugin", { scope: "file" }, () => {
    throw new Error(
      'Plugin config must be provided before using the plugin test context. Use `it.override("plugin", <pluginConfig>)` to set the plugin config for your tests.',
    );
  })
  .extend("settings", ({ plugin }) =>
    createMockPluginSettings(plugin.settingsSchema, {}),
  )
  .extend("gqlServer", { scope: "file" }, async ({ plugin }, { onCleanup }) => {
    const { buildMockServer } =
      await import("@repo/core-util-mock-graphql-server");

    const mockServer = await buildMockServer<GraphQLContext>(plugin.resolvers);

    await mockServer.start();

    onCleanup(() => mockServer.stop());

    return mockServer;
  })
  .extend("httpCache", { scope: "file" }, async () => {
    const { InMemoryLRUCache } = await import("@apollo/utils.keyvaluecache");

    return new InMemoryLRUCache();
  })
  .extend("redisClient", { scope: "file" }, async ({}, { onCleanup }) => {
    const { RedisMemoryServer } = await import("redis-memory-server");
    const { exec } = await import("node:child_process");
    const { promisify } = await import("node:util");

    async function getRedisServerBinary() {
      try {
        const { stdout: redisServerBinary } =
          await promisify(exec)("which redis-server");

        return redisServerBinary.trim();
      } catch (error) {
        throw new Error(
          `Failed to find "redis-server" binary. Is Redis installed and available in your PATH?\n${String(error)}`,
        );
      }
    }

    try {
      const systemBinary = await getRedisServerBinary();
      const redisServer = new RedisMemoryServer({ binary: { systemBinary } });

      const host = await redisServer.getHost();
      const port = await redisServer.getPort();

      const connection = new RedisConnection({ host, port });
      const client = await connection.client;

      await RedisConnection.waitUntilReady(client);

      onCleanup(async () => {
        await connection.close();
        await redisServer.stop();
      });

      return client;
    } catch (error) {
      throw new Error(`Failed to get Redis URL.\n${String(error)}`);
    }
  })
  .extend(
    "dataSourceMap",
    ({ plugin, logger, settings, httpCache, redisClient }, { onCleanup }) => {
      const dataSourceMap = new DataSourceMap();
      const instances = new Set<BaseDataSource<Record<string, unknown>>>();

      if (plugin.dataSources) {
        const dataSourceConfig = {
          cache: httpCache,
          connection: redisClient,
          logger,
          pluginSymbol: plugin.name,
          telemetry: undefined as unknown as Telemetry,
          requestBackoffDelay: 0,
          settings: settings.get(plugin.settingsSchema),
          userAgent: "mock-user-agent",
        } satisfies BaseDataSourceConfig<Record<string, unknown>>;

        for (const DataSourceClass of plugin.dataSources) {
          const dataSourceInstance = new DataSourceClass(dataSourceConfig);

          dataSourceMap.set(DataSourceClass, dataSourceInstance);
          instances.add(dataSourceInstance);
        }
      }

      onCleanup(async () => {
        for (const instance of instances) {
          await instance.worker.close();
          await instance.queue.close();
        }
      });

      return dataSourceMap;
    },
  )
  .extend(
    "gqlContext",
    ({ plugin, dataSourceMap }): GraphQLContext => ({
      [plugin.name]: {
        dataSources: dataSourceMap,
      },
      logger: {} as never,
      plugins: {},
      sendEvent: vi.fn(),
    }),
  );

it.afterEach(async ({ httpCache, redisClient }) => {
  httpCache.clear();

  await redisClient.flushdb();
});

export type {
  KeyValueCache,
  KeyValueCacheSetOptions,
} from "@apollo/utils.keyvaluecache";
