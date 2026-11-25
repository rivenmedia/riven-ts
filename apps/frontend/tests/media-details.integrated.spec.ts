import { journeyFixtures } from "@repo/util-e2e";

import { expect, test } from "#playwright/integrated-fixtures.ts";
import { waitForHydration } from "#playwright/wait-for-hydration.ts";

const { unrequestedMovie, unrequestedShow, season, episode } =
  journeyFixtures.mediaDetails;
const { movieRequest } = journeyFixtures;

test.use({ signedInAs: "user" });

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

test.describe("requesting a movie", () => {
  test.use({ scenario: "e2e-movie-request" });

  test("requesting the movie shows its state as it changes", async ({
    page,
    riven,
  }) => {
    await page.goto(`/details/media/movie/${movieRequest.tmdbId.toString()}`);

    const requestButton = page.getByRole("button", { name: "Request" });

    await waitForHydration(requestButton);
    await requestButton.click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Request" })
      .click();

    await expect(page.getByText(/request successful/iu)).toBeVisible();

    await riven.control.releaseGate(movieRequest.scrapeGateKey);

    // The scenario holds the download, so the movie stays scraped until the gate is released
    await expect(page.getByRole("status", { name: "Scraped" })).toBeVisible();

    await riven.control.releaseGate(movieRequest.downloadGateKey);

    await expect(page.getByRole("status", { name: "Completed" })).toBeVisible();
  });
});
