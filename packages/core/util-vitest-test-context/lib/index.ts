/* eslint-disable no-empty-pattern */
import { ApolloServer } from "@apollo/server";
import { type KeyValueCache } from "@apollo/utils.keyvaluecache";
import type { SetupServerApi } from "msw/node";
import { test as testBase } from "vitest";

export const it = testBase.extend<{
  httpCache: KeyValueCache;
  server: SetupServerApi;
  apolloServerInstance: ApolloServer;
  gqlServer: ApolloServer;
}>({
  async httpCache({}, use) {
    const { InMemoryLRUCache } = await import("@apollo/utils.keyvaluecache");

    await use(new InMemoryLRUCache());
  },
  async apolloServerInstance({}, use) {
    const { mockServer } = await import("@repo/core-util-mock-graphql-server");

    await use(mockServer);
  },
  async gqlServer({}, use) {
    const { mockServer } = await import("@repo/core-util-mock-graphql-server");

    await mockServer.start();

    await use(mockServer);
  },
  server: async ({}, use) => {
    const { setupServer } = await import("msw/node");

    const server = setupServer();

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
