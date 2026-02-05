/* eslint-disable no-empty-pattern */
import { ApolloServer } from "@apollo/server";
import { MockAgent, setGlobalDispatcher } from "undici";
import { test as testBase } from "vitest";

import type { SetupServerApi } from "msw/node";

export const rivenTestContext = testBase.extend<{
  server: SetupServerApi;
  apolloServerInstance: ApolloServer;
  gqlServer: ApolloServer;
  mockAgent: MockAgent;
}>({
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
  mockAgent: async ({}, use) => {
    const mockAgent = new MockAgent();

    mockAgent.disableNetConnect();

    setGlobalDispatcher(mockAgent);

    await use(mockAgent);

    await mockAgent.close();
  },
});
