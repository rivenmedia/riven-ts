/* eslint-disable no-empty-pattern */
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { expect, test as testBase } from "vitest";

import type { ApolloServer } from "@apollo/server";
import type { KeyValueCache } from "@apollo/utils.keyvaluecache";
import type { SetupServerApi } from "msw/node";

export const it = testBase.extend<{
  gqlServer: ApolloServer;
  redisUrl: string;
  httpCache: KeyValueCache;
  server: SetupServerApi;
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
    const { mockServer } = await import("@repo/core-util-mock-graphql-server");

    await mockServer.start();

    await use(mockServer);
  },
  async httpCache({}, use) {
    const { InMemoryLRUCache } = await import("@apollo/utils.keyvaluecache");

    await use(new InMemoryLRUCache());
  },
  server: async ({}, use) => {
    const { setupServer } = await import("msw/node");

    const server = setupServer();

    if (/(\*|msw)/.test(process.env["DEBUG"] ?? "")) {
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
});

export type {
  KeyValueCache,
  KeyValueCacheSetOptions,
} from "@apollo/utils.keyvaluecache";
