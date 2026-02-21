/* eslint-disable no-empty-pattern */
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { expect, test as testBase } from "vitest";

import { mockLogger } from "./create-mock-logger.ts";

import type { ApolloServer } from "@apollo/server";
import type { KeyValueCache } from "@apollo/utils.keyvaluecache";
import type { BaseDataSourceConfig } from "@repo/util-plugin-sdk";
import type { Telemetry } from "bullmq";
import type { SetupServerApi } from "msw/node";
import type { Logger } from "winston";

export const it = testBase.extend<{
  gqlServer: ApolloServer;
  redisUrl: string;
  httpCache: KeyValueCache;
  server: SetupServerApi;
  logger: Logger;
  telemetry: Telemetry;
  dataSourceConfig: Omit<BaseDataSourceConfig<never>, "settings">;
}>({
  redisUrl: [
    async ({}, use) => {
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

        await use(`redis://${host}:${port.toString()}`);

        await redisServer.stop();
      } catch (error) {
        expect.fail(
          `Failed to start Redis Memory Server. Is "redis-server" is installed?\n${String(error)}`,
        );
      }
    },
    { scope: "worker" },
  ],
  async gqlServer({}, use) {
    const { buildMockServer } =
      await import("@repo/core-util-mock-graphql-server");
    const mockServer = await buildMockServer();

    await mockServer.start();

    await use(mockServer);

    await mockServer.stop();
  },
  async httpCache({}, use) {
    const { InMemoryLRUCache } = await import("@apollo/utils.keyvaluecache");

    await use(new InMemoryLRUCache());
  },
  server: async ({}, use) => {
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

    // Expose the worker object on the test's context.
    await use(server);

    // Remove any request handlers added in individual test cases.
    // This prevents them from affecting unrelated tests.
    server.resetHandlers();

    // Stop the worker after the test.
    server.close();
  },
  logger: mockLogger,
  telemetry: undefined as unknown as Telemetry,
  dataSourceConfig: async ({ httpCache, redisUrl, logger, telemetry }, use) => {
    await use({
      cache: httpCache,
      connection: {
        url: redisUrl,
      },
      logger,
      pluginSymbol: Symbol.for(""),
      telemetry,
      requestAttempts: 1,
    });
  },
});

export type {
  KeyValueCache,
  KeyValueCacheSetOptions,
} from "@apollo/utils.keyvaluecache";
