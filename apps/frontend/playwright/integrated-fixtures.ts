import { expect } from "@playwright/test";
import { test as nextTest } from "next/experimental/testmode/playwright.js";
import path from "node:path";
import { z } from "zod";

import { api } from "#mocks/graphql.ts";

import { backendUrl, browserAuthOrigin } from "./backend-environment.ts";
import { createTestNetwork } from "./create-test-network.ts";
import { remoteAssetHandlers } from "./remote-asset-handlers.ts";
import { createBackendProxyHandlers } from "./riven/backend-proxy-handlers.ts";
import { startRivenInstance } from "./riven/start-riven-instance.ts";

import type { NextFetchSource } from "./next-fetch-source.ts";
import type { RivenInstance } from "./riven/start-riven-instance.ts";
import type { PlaywrightNetworkSource } from "@msw/playwright";
import type { MockScenarioName } from "@repo/riven/e2e";
import type { NetworkApi } from "msw/experimental";

export { expect } from "@playwright/test";
export { e2eUsers } from "@repo/riven/e2e";

const environment = z
  .object({
    /** A Postgres URL whose user can create databases, for each worker's Riven database */
    E2E_POSTGRES_URL: z.string().optional(),
  })
  .parse(process.env);

interface Options {
  /**
   * The Riven mock scenario applied before each test, which decides how Riven's external services respond.
   *
   * @default "e2e-baseline"
   */
  scenario: MockScenarioName;
}

interface Fixtures {
  /**
   * The network shared by the browser (HTTP and WebSocket) and the Next.js server,
   * which re-addresses their backend requests to the worker's Riven.
   */
  network: NetworkApi<[PlaywrightNetworkSource, NextFetchSource]>;

  _scenario: undefined;
}

interface WorkerFixtures {
  /** The worker's Riven, which runs in test mode with every external service mocked */
  riven: RivenInstance;
}

export const test = nextTest.extend<Options & Fixtures, WorkerFixtures>({
  riven: [
    async ({}, use, workerInfo) => {
      if (!environment.E2E_POSTGRES_URL) {
        throw new Error(
          "Set E2E_POSTGRES_URL to a Postgres URL whose user can create databases, e.g. postgres://postgres:<password>@localhost:5432/postgres",
        );
      }

      const origin = workerInfo.project.use.baseURL;

      if (!origin) {
        throw new Error("The integrated suite needs `use.baseURL` to be set");
      }

      const riven = await startRivenInstance({
        parallelIndex: workerInfo.parallelIndex,
        postgresUrl: environment.E2E_POSTGRES_URL,
        origin,
        logPath: path.join(
          workerInfo.project.outputDir,
          `riven-${String(workerInfo.parallelIndex)}.log`,
        ),
      });

      await use(riven);
      await riven.stop();
    },
    { scope: "worker", timeout: 120_000 },
  ],
  scenario: ["e2e-baseline", { option: true }],
  _scenario: [
    async ({ riven, scenario }, use, testInfo) => {
      await riven.control.applyScenario(scenario);

      await use(undefined);

      const unhandledRequests = await riven.control.getUnhandledRequests();

      if (
        testInfo.status !== testInfo.expectedStatus ||
        unhandledRequests.length > 0
      ) {
        await testInfo.attach("riven.log", {
          path: riven.logPath,
          contentType: "text/plain",
        });
      }

      expect(
        unhandledRequests,
        "Riven made requests to external services that no handler mocked",
      ).toEqual([]);
    },
    { auto: true },
  ],
  network: [
    // `next` registers its own routes, so it must be set up first for the network's routes to take precedence.
    // It depends on `_scenario`, so the test's requests have finished by the time its unhandled requests are checked.
    async (
      { next, _nextWorker, context, riven, baseURL, _scenario: _ },
      use,
      testInfo,
    ) => {
      const { network, dispose } = await createTestNetwork({
        next,
        nextWorker: _nextWorker,
        context,
        testId: testInfo.testId,
        handlers: [
          ...createBackendProxyHandlers({
            rivenUrl: riven.url,
            origin: baseURL ?? "",
            backendUrl,
            extraOrigins: [browserAuthOrigin],
          }),
          ...remoteAssetHandlers,
          // Subscriptions aren't forwarded to Riven yet, so they connect, but never receive anything
          api.subscription(/.*/u, () => {
            // Nothing changes
          }),
        ],
      });

      await use(network);
      await dispose();
    },
    { auto: true },
  ],
});
