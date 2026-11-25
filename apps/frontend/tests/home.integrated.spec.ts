import { journeyFixtures } from "@repo/util-e2e";

import { expect, test } from "#playwright/integrated-fixtures.ts";
import { waitForHydration } from "#playwright/wait-for-hydration.ts";

const {
  nowPlaying,
  trendingMoviesToday,
  trendingMoviesThisWeek,
  trendingShows,
} = journeyFixtures.home;

test.use({ signedInAs: "user" });

test("shows what's playing and trending", async ({ page }) => {
  await page.goto("/");

  const nowPlayingCarousel = page.getByRole("region", {
    name: "Now playing movies carousel",
  });

  await expect(
    nowPlayingCarousel.getByRole("img", { name: nowPlaying.title }).first(),
  ).toBeVisible();
  await expect(
    nowPlayingCarousel.getByRole("link", { name: "More Info" }),
  ).toHaveAttribute(
    "href",
    `/details/media/movie/${nowPlaying.tmdbId.toString()}`,
  );

  await expect(
    page.getByRole("heading", { name: trendingMoviesToday.title }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: trendingShows.today.title }),
  ).toBeVisible();
});

test("switches the trending movies to this week", async ({ page }) => {
  await page.goto("/");

  const thisWeek = page
    .getByRole("region", { name: "Trending Movies actions" })
    .getByRole("button", { name: "This Week" });

  await waitForHydration(thisWeek);
  await thisWeek.click();

  await expect(
    page.getByRole("heading", { name: trendingMoviesThisWeek.title }),
  ).toBeVisible();
});
