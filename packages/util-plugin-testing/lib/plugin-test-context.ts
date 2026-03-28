/* eslint-disable no-empty-pattern */
import assert from "node:assert";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { expect, test as testBase } from "vitest";

import { mockLogger } from "./create-mock-logger.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { Telemetry } from "bullmq";

export const it = testBase
  .extend("plugin", undefined as RivenPlugin | undefined)
  .extend("gqlServer", async ({ plugin }, { onCleanup }) => {
    assert(plugin, "Plugin instance must be provided to use gqlServer context");

    const { buildMockServer } =
      await import("@repo/core-util-mock-graphql-server");

    const mockServer = await buildMockServer(plugin.resolvers);

    await mockServer.start();

    onCleanup(() => mockServer.stop());

    return mockServer;
  })
  .extend("redisUrl", async ({}, { onCleanup }) => {
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
  .extend("logger", mockLogger)
  .extend("telemetry", undefined as unknown as Telemetry)
  .extend("dataSourceConfig", async ({ redisUrl, logger, telemetry }) => {
    const { InMemoryLRUCache } = await import("@apollo/utils.keyvaluecache");

    return {
      cache: new InMemoryLRUCache(),
      connection: {
        url: redisUrl,
      },
      logger,
      pluginSymbol: Symbol.for("@repo/util-plugin-testing"),
      telemetry,
      requestAttempts: 1,
    };
  });

export type {
  KeyValueCache,
  KeyValueCacheSetOptions,
} from "@apollo/utils.keyvaluecache";
