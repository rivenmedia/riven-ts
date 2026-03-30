/* eslint-disable no-empty-pattern */
import { DataSourceMap, type RivenPlugin } from "@repo/util-plugin-sdk";

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { expect, test as testBase } from "vitest";

import { mockLogger } from "./create-mock-logger.ts";
import { createMockPluginSettings } from "./create-mock-plugin-settings.ts";

import type { ApolloServerContext } from "@repo/core-util-mock-graphql-server";
import type { Telemetry } from "bullmq";

async function getRedisUrl(
  onCleanup: (cleanupFunction: () => Promise<void>) => void,
): Promise<string> {
  const { RedisMemoryServer } = await import("redis-memory-server");

  try {
    const { stdout: redisServerBinary } =
      await promisify(exec)("which redis-server");

    const redisServer = new RedisMemoryServer({
      binary: {
        systemBinary: redisServerBinary.trim(),
      },
    });

    const host = await redisServer.getHost();
    const port = await redisServer.getPort();

    onCleanup(async () => {
      await redisServer.stop();
    });

    return `redis://${host}:${port.toString()}`;
  } catch (error) {
    expect.fail(
      `Failed to start Redis Memory Server. Is "redis-server" is installed?\n${String(error)}`,
    );
  }
}

export const it = testBase
  .extend("server", { scope: "file" }, async ({}, { onCleanup }) => {
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
  .extend("logger", { scope: "worker" }, mockLogger)
  .extend<"plugin", RivenPlugin>("plugin", { scope: "file" }, () => {
    throw new Error(
      'Plugin config must be provided before using the plugin test context. Use `it.override("plugin", <pluginConfig>)` to set the plugin config for your tests.',
    );
  })
  .extend("settings", { scope: "file" }, ({ plugin }) =>
    createMockPluginSettings(plugin.settingsSchema, {}),
  )
  .extend(
    "dataSourceMap",
    { scope: "file" },
    async ({ plugin, logger, settings }, { onCleanup }) => {
      const dataSourceMap = new DataSourceMap();

      if (plugin.dataSources) {
        const { InMemoryLRUCache } =
          await import("@apollo/utils.keyvaluecache");

        const dataSourceConfig = {
          cache: new InMemoryLRUCache(),
          connection: {
            url: await getRedisUrl(onCleanup),
          },
          logger,
          pluginSymbol: plugin.name,
          telemetry: undefined as unknown as Telemetry,
          requestAttempts: 1,
        };

        for (const DataSourceClass of plugin.dataSources) {
          const dataSourceInstance = new DataSourceClass({
            ...dataSourceConfig,
            pluginSymbol: plugin.name,
            settings: settings.get(plugin.settingsSchema),
          });

          dataSourceMap.set(DataSourceClass, dataSourceInstance);
        }
      }

      return dataSourceMap;
    },
  )
  .extend("gqlServer", { scope: "file" }, async ({ plugin }, { onCleanup }) => {
    const { buildMockServer } =
      await import("@repo/core-util-mock-graphql-server");

    const mockServer = await buildMockServer(plugin.resolvers);

    await mockServer.start();

    onCleanup(() => mockServer.stop());

    return mockServer;
  })
  .extend(
    "gqlContext",
    { scope: "file" },
    ({ plugin, dataSourceMap }): ApolloServerContext => ({
      [plugin.name]: {
        dataSources: dataSourceMap,
      },
    }),
  );

export type {
  KeyValueCache,
  KeyValueCacheSetOptions,
} from "@apollo/utils.keyvaluecache";
