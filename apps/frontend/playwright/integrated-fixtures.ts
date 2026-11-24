import { e2eUsers } from "@repo/util-e2e";

import { expect } from "@playwright/test";
import { test as nextTest } from "next/experimental/testmode/playwright.js";
import path from "node:path";
import { z } from "zod";

import { backendUrl } from "./backend-environment.ts";
import { createTestNetwork } from "./create-test-network.ts";
import { remoteAssetHandlers } from "./remote-asset-handlers.ts";
import { createBackendProxyHandlers } from "./riven/backend-proxy-handlers.ts";
import { startRivenInstance } from "./riven/start-riven-instance.ts";
import { createWebSocketBridge } from "./riven/websocket-bridge.ts";

import type { NextFetchSource } from "./next-fetch-source.ts";
import type { RivenInstance } from "./riven/start-riven-instance.ts";
import type { PlaywrightNetworkSource } from "@msw/playwright";
import type { UserRole } from "@repo/util-auth/access-control";
import type { MockScenarioName, UnhandledRequest } from "@repo/util-e2e";
import type { NetworkApi } from "msw/experimental";

export { expect } from "@playwright/test";
export { e2eUsers } from "@repo/util-e2e";

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

  /**
   * The role of the seeded user who is signed in to Riven when the test starts, or `null` when signed out.
   *
   * @default null
   */
  signedInAs: UserRole | null;
}

interface Fixtures {
  /**
   * The network shared by the browser (HTTP and WebSocket) and the Next.js server,
   * which re-addresses their backend requests to the worker's Riven.
   */
  network: NetworkApi<[PlaywrightNetworkSource, NextFetchSource]>;

  _scenario: undefined;
  _signIn: undefined;
}

interface WorkerFixtures {
  /** The worker's Riven, which runs in test mode with every external service mocked */
  riven: RivenInstance;
}

/** The name and value of a `Set-Cookie` header, without its attributes */
const parseSetCookie = (header: string) => {
  const [pair = ""] = header.split(";");
  const separatorIndex = pair.indexOf("=");

  return {
    name: pair.slice(0, separatorIndex).trim(),
    value: pair.slice(separatorIndex + 1).trim(),
  };
};

const formatUnhandledRequests = (requests: UnhandledRequest[]) =>
  requests.map(({ method, url }) => `  ${method} ${url}`).join("\n");

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

      // The first test's scenario clears these, so a request Riven makes while it boots is only reported here.
      // Worker fixtures can't attach files, so the error carries the log tail.
      const bootUnhandledRequests = await riven.control.getUnhandledRequests();

      if (bootUnhandledRequests.length > 0) {
        // Stopping first flushes the log
        await riven.stop();

        const logTail = await riven.readLogTail();

        throw new Error(
          `Riven made requests to external services while it booted that no handler mocked:\n${formatUnhandledRequests(bootUnhandledRequests)}\nLast log lines:\n${logTail}`,
        );
      }

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

      const attachRivenLog = () =>
        testInfo.attach("riven.log", {
          path: riven.logPath,
          contentType: "text/plain",
        });

      const unhandledRequests = await riven.control
        .getUnhandledRequests()
        .catch(async (error: unknown) => {
          // The check itself failed, e.g. because Riven crashed during the test
          await attachRivenLog();

          throw error;
        });

      if (
        testInfo.status !== testInfo.expectedStatus ||
        unhandledRequests.length > 0
      ) {
        await attachRivenLog();
      }

      expect(
        unhandledRequests,
        "Riven made requests to external services that no handler mocked",
      ).toEqual([]);
    },
    { auto: true },
  ],
  signedInAs: [null, { option: true }],
  _signIn: [
    // Signs in after `_scenario`'s reset, which would otherwise wipe the session
    async ({ riven, context, baseURL, signedInAs, _scenario: _ }, use) => {
      if (signedInAs) {
        const { username, password } = e2eUsers[signedInAs];
        const response = await fetch(
          new URL("/api/auth/sign-in/username", riven.url),
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ username, password }),
          },
        );

        if (!response.ok) {
          throw new Error(
            `Signing in as ${signedInAs} failed with ${String(response.status)}: ${await response.text()}`,
          );
        }

        const { hostname } = new URL(baseURL ?? "");

        // Riven sets the cookies for its own origin, but the browser sends them to the Next.js server's
        await context.addCookies(
          response.headers.getSetCookie().map((header) => {
            const { name, value } = parseSetCookie(header);

            return { name, value, domain: hostname, path: "/", secure: false };
          }),
        );
      }

      await use(undefined);
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
          }),
          ...remoteAssetHandlers,
          createWebSocketBridge(riven.url, async () => {
            // The browser sends the frontend's cookies with its upgrade request, which Riven authenticates by
            const cookies = await context.cookies(baseURL);

            return cookies
              .map(({ name, value }) => `${name}=${value}`)
              .join("; ");
          }),
        ],
      });

      await use(network);
      await dispose();
    },
    { auto: true },
  ],
});
