import { unrequestedMovie } from "#app/(protected)/details/media/[type]/[id]/media-details.fixtures.ts";
import { createLibraryItemsHandler } from "#mocks/handlers/library.handler.ts";
import { unrequestedMovieHandlers } from "#mocks/handlers/media-details.handler.ts";
import { expect, test, withHandlers } from "#playwright/fixtures.ts";
import { waitForHydration } from "#playwright/wait-for-hydration.ts";

const libraryMovie = {
  __typename: "Movie",
  id: "library-movie",
  type: "movie",
  title: unrequestedMovie.title,
  releaseDate: "2017-09-08",
  year: 2017,
  posterUrl: "https://image.tmdb.org/t/p/w300/9E2y5Q7WlCVNEhP5GiVTjhEhx1o.jpg",
  state: "completed",
  primaryExternalId: unrequestedMovie.id,
} as const;

const libraryShow = {
  __typename: "Show",
  id: "library-show",
  type: "show",
  title: "Arcane",
  releaseDate: "2021-11-06",
  year: 2021,
  posterUrl: "https://image.tmdb.org/t/p/w300/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
  state: "indexed",
  primaryExternalId: "371028",
} as const;

// Library stories use Faker's placeholder images, which `next/image` doesn't allow outside Storybook
const libraryItems = [libraryMovie, libraryShow];

test.use({
  signedInAs: "user",
  handlers: withHandlers(
    createLibraryItemsHandler(libraryItems),
    ...unrequestedMovieHandlers,
  ),
});

test("lists the library's items", async ({ page }) => {
  await page.goto("/library");

  for (const { title } of libraryItems) {
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
  await search.fill("arcane");

  await expect(
    page.getByRole("main").getByText("Arcane", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("main").getByText(libraryMovie.title, { exact: true }),
  ).toBeHidden();
});

test("opens an item's details", async ({ page }) => {
  await page.goto("/library");

  await page
    .getByRole("main")
    .getByText(libraryMovie.title, { exact: true })
    .click();

  await expect(page).toHaveURL(`/details/media/movie/${unrequestedMovie.id}`);
  await expect(
    page.getByRole("heading", { level: 1, name: unrequestedMovie.title }),
  ).toBeVisible();
});
