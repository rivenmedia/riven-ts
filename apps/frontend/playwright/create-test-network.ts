import { PlaywrightNetworkSource } from "@msw/playwright";
import { defineNetwork } from "msw/experimental";

import { NextFetchSource, isNextFetchFrame } from "./next-fetch-source.ts";

import type { BrowserContext } from "@playwright/test";
import type { AnyHandler } from "msw";
import type { NextFixture } from "next/experimental/testmode/playwright.js";

interface CreateTestNetworkInput {
  next: NextFixture;

  /** Next.js' worker fixture, which holds the port of the test proxy */
  nextWorker: { proxyPort: number };

  context: BrowserContext;
  testId: string;
  handlers: AnyHandler[];
}

/**
 * Creates the network shared by the browser (HTTP and WebSocket) and the Next.js server, for a single test.
 *
 * `next` registers its own routes, so it must be set up before this is called for the network's routes to take
 * precedence.
 */
export async function createTestNetwork({
  next,
  nextWorker,
  context,
  testId,
  handlers,
}: CreateTestNetworkInput) {
  // Next.js' fixture only adds the test's headers in a route, which a redirected request doesn't go through.
  // Without them, the server can't attribute that request's fetches to the test, so they'd reach the real backend.
  await context.setExtraHTTPHeaders({
    "Next-Test-Proxy-Port": String(nextWorker.proxyPort),
    "Next-Test-Data": testId,
  });

  const nextFetchSource = new NextFetchSource(next);

  const network = defineNetwork({
    sources: [
      new PlaywrightNetworkSource({ context, skipAssetRequests: true }),
      nextFetchSource,
    ],
    handlers,
    context: { quiet: true },
    onUnhandledFrame: ({ frame, defaults }) => {
      // The page's own requests (navigations, RSC payloads, etc.) are expected to reach the Next.js server
      if (isNextFetchFrame(frame)) {
        defaults.warn();
      }
    },
  });

  await network.enable();

  return {
    network,
    dispose: async () => {
      // Close the pages, then let the server finish their requests, so they aren't cut off (and logged as errors)
      await Promise.all(context.pages().map((page) => page.close()));
      await nextFetchSource.waitForIdle();
      await network.disable();
    },
  };
}
