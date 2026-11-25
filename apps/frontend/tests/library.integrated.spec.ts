import { journeyFixtures } from "@repo/util-e2e";

import { expect, test } from "#playwright/integrated-fixtures.ts";
import { waitForHydration } from "#playwright/wait-for-hydration.ts";

const { movie, show } = journeyFixtures.library;

test.use({ scenario: "e2e-library", signedInAs: "user" });

test("lists the library's items", async ({ page }) => {
  await page.goto("/library");

  for (const { title } of [movie, show]) {
    await expect(
      page.getByRole("main").getByText(title, { exact: true }),
    ).toBeVisible();
  }
});

test("searching narrows down the items", async ({ page }) => {
  await page.goto("/library");

  const search = page
    .getByRole("main")
    .getByRole("textbox", { name: "Search..." });

  // The search only filters once hydrated
  await waitForHydration(search);
  await search.fill(show.title.toLowerCase());

  await expect(
    page.getByRole("main").getByText(show.title, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("main").getByText(movie.title, { exact: true }),
  ).toBeHidden();
});

test("opens an item's details", async ({ page }) => {
  await page.goto("/library");

  await page.getByRole("main").getByText(movie.title, { exact: true }).click();

  await expect(page).toHaveURL(
    `/details/media/movie/${movie.tmdbId.toString()}`,
  );
  await expect(
    page.getByRole("heading", { level: 1, name: movie.title }),
  ).toBeVisible();
});
