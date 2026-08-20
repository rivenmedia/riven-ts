import { expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";

function sortByTitleAndState(items: { fullTitle: string; state: string }[]) {
  return items.toSorted((a, b) => {
    if (a.fullTitle < b.fullTitle) {
      return -1;
    }

    if (a.fullTitle > b.fullTitle) {
      return 1;
    }

    if (a.state < b.state) {
      return -1;
    }

    if (a.state > b.state) {
      return 1;
    }

    return 0;
  });
}

it("defaults to page 1", async ({
  services: { mediaItemService },
  factories: { movieFactory },
}) => {
  const movieA = await movieFactory.createOne({ title: "A Movie" });

  // Create a second movie to ensure pagination works correctly
  await movieFactory.createOne({ title: "B Movie" });

  const { items } = await mediaItemService.getPaginatedMediaItems({
    itemsPerPage: 1,
  });

  expect(items).toHaveLength(1);
  expect(items[0]?.fullTitle).toBe(movieA.fullTitle);
});

it("defaults to 25 items per page", async ({
  seeders: { seedIndexedMovie },
  services: { mediaItemService },
}) => {
  await seedIndexedMovie(50);

  const { items } = await mediaItemService.getPaginatedMediaItems({
    filter: ["movie"],
  });

  expect(items).toHaveLength(25);
});

it("returns a paginated list of media items", async ({
  seeders: { seedIndexedMovie },
  services: { mediaItemService },
}) => {
  expect.assertions(4);

  const movies = await seedIndexedMovie(20);
  const sortedMovies = sortByTitleAndState(
    movies.map(({ movie }) => ({
      fullTitle: movie.fullTitle,
      state: movie.state,
    })),
  );

  let offset = 0;
  let cursor: string | null = null;

  const itemsPerPage = 5;

  do {
    const page = await mediaItemService.getPaginatedMediaItems({
      itemsPerPage,
      after: cursor,
    });

    expect(page.items).toStrictEqual(
      expect.arrayContaining(
        sortedMovies
          .slice(offset, offset + itemsPerPage)
          .map(({ fullTitle, state }) =>
            expect.objectContaining({
              fullTitle,
              state,
            }),
          ),
      ),
    );

    offset += itemsPerPage;
    cursor = page.endCursor;
  } while (offset < sortedMovies.length);
});

it("filters to the selected media item type", async ({
  seeders: { seedIndexedMovie, seedIndexedShow },
  services: { mediaItemService },
}) => {
  await seedIndexedMovie(10);
  await seedIndexedShow();

  const { items } = await mediaItemService.getPaginatedMediaItems({
    filter: ["movie"],
    itemsPerPage: 100,
  });

  expect(items).toHaveLength(10);
});

it("filters to movies and shows by default", async ({
  seeders: { seedIndexedMovie, seedIndexedShow },
  services: { mediaItemService },
}) => {
  await seedIndexedMovie(10);
  await seedIndexedShow();

  const { items } = await mediaItemService.getPaginatedMediaItems();

  expect(items).toStrictEqual(
    expect.not.arrayContaining([
      expect.objectContaining({
        type: expect.stringMatching(/^season|episode$/u),
      }),
    ]),
  );
});

it("orders by title and then state", async ({
  seeders: { seedIndexedMovie },
  services: { mediaItemService },
}) => {
  const movies = await seedIndexedMovie(10);

  const { items } = await mediaItemService.getPaginatedMediaItems();

  const expectedMovies = sortByTitleAndState(
    movies.map(({ movie }) => ({
      fullTitle: movie.fullTitle,
      state: movie.state,
    })),
  );

  expect(items).toStrictEqual(
    expect.arrayContaining(
      expectedMovies.map(({ fullTitle, state }) =>
        expect.objectContaining({
          fullTitle,
          state,
        }),
      ),
    ),
  );
});

it("returns unrequested items when includeUnrequestedItems is true", async ({
  seeders: { seedPartiallyRequestedShow },
  services: { mediaItemService },
}) => {
  const show = await seedPartiallyRequestedShow();

  const { items } = await mediaItemService.getPaginatedMediaItems({
    filter: ["season"],
    includeUnrequestedItems: true,
  });

  expect.assert(show.seasons);

  expect(items).toHaveLength(show.seasons.length);
});

it("does not return unrequested items when includeUnrequestedItems is false", async ({
  seeders: { seedPartiallyRequestedShow },
  services: { mediaItemService },
}) => {
  const show = await seedPartiallyRequestedShow();

  const { items } = await mediaItemService.getPaginatedMediaItems({
    filter: ["season"],
    includeUnrequestedItems: false,
  });

  expect.assert(show.seasons);

  expect(items).toHaveLength(
    show.seasons.filter((season) => season.isRequested).length,
  );
});
