import { journeyFixtures } from "@repo/util-e2e";

import { http } from "msw/http";
import { ws } from "msw/ws";

import { expect, test } from "#playwright/integrated-fixtures.ts";
import { waitForHydration } from "#playwright/wait-for-hydration.ts";

import type { AnyHandler } from "msw";

const { unrequestedMovie, unrequestedShow, season, episode } =
  journeyFixtures.mediaDetails;
const { movieRequest } = journeyFixtures;

test.use({ signedInAs: "user" });

interface GraphQLWsMessage {
  id?: string;
  type: string;
  payload?: { operationName?: string };
}

/**
 * Tracks the browser's active GraphQL subscriptions to `operationName`, from the frames it sends over its WebSocket.
 * Riven doesn't replay a state change to a subscription that starts after it, so a test waits for one to be active.
 *
 * Subscriptions start when the page's WebSocket connects, so this must be called before the page loads.
 *
 * @returns The IDs of the active subscriptions
 */
const trackSubscriptions = (
  network: { use: (...handlers: AnyHandler[]) => void },
  operationName: string,
) => {
  const activeIds = new Set<string>();

  network.use(
    ws.link("/graphql").addEventListener("connection", ({ client }) => {
      client.addEventListener("message", ({ data }) => {
        if (typeof data !== "string") {
          return;
        }

        const { id, type, payload } = JSON.parse(data) as GraphQLWsMessage;

        if (!id) {
          return;
        }

        if (type === "subscribe" && payload?.operationName === operationName) {
          activeIds.add(id);
        } else if (type === "complete") {
          activeIds.delete(id);
        }
      });
    }),
  );

  return activeIds;
};

/**
 * Holds the page's refreshes (its RSC requests to the Next.js server) while it's held,
 * so only a subscription can change what the page shows.
 *
 * @returns Functions that start and stop holding the refreshes
 */
const holdPageRefreshes = (network: {
  use: (...handlers: AnyHandler[]) => void;
}) => {
  let refreshes: PromiseWithResolvers<void> | undefined = undefined;

  network.use(
    http.get("*", async ({ request }) => {
      if (
        refreshes &&
        (request.headers.get("rsc") === "1" ||
          new URL(request.url).searchParams.has("_rsc"))
      ) {
        await refreshes.promise;
      }

      // Lets the request through, to the next handler or the Next.js server
      return undefined;
    }),
  );

  return {
    hold() {
      refreshes = Promise.withResolvers();
    },
    release() {
      refreshes?.resolve();
      refreshes = undefined;
    },
  };
};

test.describe("an unrequested movie", () => {
  test("shows the movie's details", async ({ page }) => {
    await page.goto(
      `/details/media/movie/${unrequestedMovie.tmdbId.toString()}`,
    );

    const main = page.getByRole("main");

    await expect(
      main.getByRole("heading", { level: 1, name: unrequestedMovie.title }),
    ).toBeVisible();
    await expect(main.getByText(unrequestedMovie.overview)).toBeVisible();
    await expect(
      main.getByRole("heading", { name: unrequestedMovie.cast[0].name }),
    ).toBeVisible();
    await expect(
      main.getByRole("heading", {
        name: unrequestedMovie.recommendation.title,
      }),
    ).toBeVisible();
    await expect(
      main.getByRole("heading", { name: unrequestedMovie.similar.title }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Request" })).toBeVisible();
  });
});

test.describe("an unrequested show", () => {
  test("navigates from the show to a season, then an episode", async ({
    page,
  }) => {
    const showPath = `/details/media/show/${unrequestedShow.tvdbId.toString()}`;

    await page.goto(showPath);

    for (const { name } of unrequestedShow.cast) {
      await expect(
        page.getByRole("main").getByRole("heading", { name }),
      ).toBeVisible();
    }

    await page.getByRole("link", { name: season.title }).click();

    await expect(page).toHaveURL(
      `${showPath}/seasons/${season.number.toString()}`,
    );
    await expect(
      page.getByRole("heading", { level: 1, name: season.title }),
    ).toBeVisible();

    await page.getByRole("link", { name: episode.title }).click();

    await expect(page).toHaveURL(
      `${showPath}/seasons/${season.number.toString()}/episodes/${episode.number.toString()}`,
    );
    await expect(
      page.getByRole("heading", { level: 1, name: episode.title }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("main")
        .getByRole("heading", { name: episode.cast[0].name }),
    ).toBeVisible();
  });
});

test.describe("a requested movie", () => {
  test.use({ scenario: "e2e-movie-request" });

  test("requesting the movie shows its state as it changes", async ({
    network,
    page,
    riven,
  }) => {
    const requestSubscriptions = trackSubscriptions(
      network,
      "OnItemRequestChanged",
    );
    const stateSubscriptions = trackSubscriptions(
      network,
      "OnMediaItemStateChanged",
    );
    const pageRefreshes = holdPageRefreshes(network);

    await page.goto(`/details/media/movie/${movieRequest.tmdbId.toString()}`);

    const requestButton = page.getByRole("button", { name: "Request" });

    await waitForHydration(requestButton);

    // The page refreshes to show the badge once Riven indexes the movie, which it learns of from this subscription
    await expect
      .poll(() => requestSubscriptions.size, {
        message: "Wait for the page to subscribe to the movie's request",
      })
      .toBeGreaterThan(0);

    await requestButton.click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Request" })
      .click();

    await expect(page.getByText(/request successful/iu)).toBeVisible();

    // The scenario holds the scrape, so the movie stays indexed until the gate is released
    await expect(page.getByRole("status", { name: "Indexed" })).toBeVisible();
    await expect
      .poll(() => stateSubscriptions.size, {
        message: "Wait for the badge to subscribe to the movie's state",
      })
      .toBeGreaterThan(0);

    // Scraping also refreshes the page, as Riven moves the item request from completed (once indexed) to processing.
    // Holding the refresh means only the badge's subscription can show the change.
    pageRefreshes.hold();

    try {
      await riven.control.releaseGate(movieRequest.scrapeGateKey);

      // The scenario holds the download, so the movie stays scraped until the gate is released
      await expect(page.getByRole("status", { name: "Scraped" })).toBeVisible();
    } finally {
      pageRefreshes.release();
    }

    await riven.control.releaseGate(movieRequest.downloadGateKey);

    await expect(page.getByRole("status", { name: "Completed" })).toBeVisible();
  });
});
