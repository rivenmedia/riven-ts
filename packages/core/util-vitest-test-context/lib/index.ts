import { setupServer } from "msw/node";
import { test as testBase } from "vitest";
import { buildMockServer } from "@repo/core-util-mock-graphql-server";

const server = setupServer();

export const it = testBase.extend<{
  server: typeof server;
  gqlServer: Awaited<ReturnType<typeof buildMockServer>>;
}>({
  async gqlServer({}, use) {
    const mockServer = await buildMockServer();

    await mockServer.start();

    await use(mockServer);

    await mockServer.stop();
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
