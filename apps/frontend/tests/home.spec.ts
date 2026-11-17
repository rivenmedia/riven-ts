import { expect, test } from "#playwright/fixtures.ts";

test.use({ signedInAs: "user" });

test("shows what's playing, recently added and trending", async ({ page }) => {
  await page.goto("/");

  const nowPlaying = page.getByRole("region", {
    name: "Now playing movies carousel",
  });

  await expect(
    nowPlaying.getByRole("img", { name: "John Wick: Chapter 4" }).first(),
  ).toBeVisible();
  await expect(
    nowPlaying.getByRole("link", { name: "More Info" }),
  ).toHaveAttribute("href", "/details/media/movie/603692");

  await expect(
    page.getByRole("link", { name: "Arcane TV • 2024" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Avengers: Endgame" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Breaking Bad" }),
  ).toBeVisible();
});

test("switches the trending movies to this week", async ({ page }) => {
  await page.goto("/");

  await page
    .getByRole("region", { name: "Trending Movies actions" })
    .getByRole("button", { name: "This Week" })
    .click();

  await expect(
    page.getByRole("heading", { name: "The Odyssey" }),
  ).toBeVisible();
});
