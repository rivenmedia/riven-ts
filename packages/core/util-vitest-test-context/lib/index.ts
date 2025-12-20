/* eslint-disable no-empty-pattern */

import { setupServer } from "msw/node";
import { test as testBase } from "vitest";
import { mockServer } from "@repo/core-util-mock-graphql-server";
import { InMemoryLRUCache } from "@apollo/utils.keyvaluecache";

const server = setupServer();

export const it = testBase.extend<{
  httpCache: InMemoryLRUCache;
  server: typeof server;
  gqlServer: typeof mockServer;
}>({
  async httpCache({}, use) {
    await use(new InMemoryLRUCache());
  },
  async gqlServer({}, use) {
    await use(mockServer);
  },
  server: [
    async ({}, use) => {
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
    {
      auto: true,
    },
  ],
});
