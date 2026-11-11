import { REQUEST_ITEM } from "#app/(protected)/details/media/[type]/[id]/_components/item-action-toolbar/actions/request-item/_mutations/request-item.mutation.ts";
import {
  unrequestedMovie,
  unrequestedShow,
} from "#app/(protected)/details/media/[type]/[id]/media-details.fixtures.ts";
import { GET_SEASON } from "#app/(protected)/details/media/[type]/[id]/seasons/[seasonNumber]/_queries/get-season.query.ts";
import { GET_EPISODE_CAST } from "#app/(protected)/details/media/[type]/[id]/seasons/[seasonNumber]/episodes/[episodeNumber]/_queries/get-episode-cast.query.ts";
import {
  cast as episodeCast,
  season,
  show as seasonShow,
} from "#app/(protected)/details/media/[type]/[id]/seasons/[seasonNumber]/season.fixtures.ts";
import { api } from "#mocks/graphql.ts";
import {
  mockItemRequestChanges,
  mockItemState,
  mockMediaItemQuery,
  mockRequestedMovie,
  unrequestedMovieHandlers,
  unrequestedShowHandlers,
} from "#mocks/handlers/media-details.handler.ts";
import { createSeasonStateHandlers } from "#mocks/handlers/season-state.handler.ts";
import {
  HttpResponse,
  expect,
  test,
  withHandlers,
} from "#playwright/fixtures.ts";

import type { AnyHandler } from "msw";

test.use({ signedInAs: "user" });

// The movie's media item once it's been requested
const requestedMovieItem = {
  id: "requested-movie",
  state: "indexed",
  isRequested: true,
} as const;

/**
 * Mocks requesting the movie.
 *
 * Subscription handlers attach when the page's WebSocket connects, so this must be called before the page loads.
 *
 * @returns The requested movie's state, so tests can change it
 */
const mockMovieRequest = (network: {
  use: (...handlers: AnyHandler[]) => void;
}) => {
  const itemRequestChanges = mockItemRequestChanges(unrequestedMovie.id);
  const movieState = mockItemState("Movie", requestedMovieItem);

  network.use(
    itemRequestChanges.handler,
    ...movieState.handlers,
    api.mutation(REQUEST_ITEM, () => {
      const requestedMovie = mockRequestedMovie({
        availableActions: ["delete", "reset", "pause"],
        mediaItem: requestedMovieItem,
        itemState: movieState,
      });

      network.use(
        ...requestedMovie.handlers,
        mockMediaItemQuery(unrequestedMovie, {
          __typename: "Movie",
          ...requestedMovieItem,
        }),
      );

      itemRequestChanges.publishChange(requestedMovie.itemRequestId);

      return HttpResponse.json({ data: { requestItem: true } });
    }),
  );

  return movieState;
};

test.describe("an unrequested movie", () => {
  test.use({ handlers: withHandlers(...unrequestedMovieHandlers) });

  test("shows the movie's details", async ({ page }) => {
    await page.goto(`/details/media/movie/${unrequestedMovie.id}`);

    const main = page.getByRole("main");

    await expect(main.getByText(unrequestedMovie.overview)).toBeVisible();
    await expect(
      main.getByRole("heading", { name: "Jaeden Martell" }),
    ).toBeVisible();
    await expect(
      main.getByRole("heading", { name: "Clown in a Cornfield" }),
    ).toBeVisible();
    await expect(
      main.getByRole("heading", { name: "It Chapter 2" }),
    ).toBeVisible();
  });

  test("requesting the movie shows its state as it changes", async ({
    network,
    page,
  }) => {
    const movieState = mockMovieRequest(network);

    await page.goto(`/details/media/movie/${unrequestedMovie.id}`);

    await page.getByRole("button", { name: "Request" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Request" })
      .click();

    await expect(page.getByText(/request successful/iu)).toBeVisible();
    await expect(page.getByRole("status", { name: "Indexed" })).toBeVisible();

    movieState.publishState("completed");

    await expect(page.getByRole("status", { name: "Completed" })).toBeVisible();
  });
});

test.describe("an unrequested show", () => {
  test.use({
    handlers: withHandlers(
      ...unrequestedShowHandlers,
      // The season and episode pages, which share the show's ID
      api.query(GET_SEASON, ({ variables }) =>
        HttpResponse.json({
          data: {
            tmdbItem: { ...seasonShow, id: variables.id, season },
          },
        }),
      ),
      ...createSeasonStateHandlers(null),
      api.query(GET_EPISODE_CAST, ({ variables }) =>
        HttpResponse.json({
          data: {
            tmdbItem: {
              __typename: "TmdbIndexerData",
              id: variables.id,
              type: "show",
              season: {
                __typename: "IndexerSeason",
                id: season.id,
                episode: {
                  __typename: "IndexerEpisode",
                  id: `episode-${String(variables.episodeNumber)}`,
                  cast: episodeCast,
                },
              },
            },
          },
        }),
      ),
    ),
  });

  test("navigates from the show to a season, then an episode", async ({
    page,
  }) => {
    await page.goto(`/details/media/show/${unrequestedShow.id}`);

    await expect(
      page.getByRole("main").getByRole("heading", { name: "Ella Purnell" }),
    ).toBeVisible();

    await page.getByRole("link", { name: /season 1/iu }).click();

    await expect(page).toHaveURL(
      `/details/media/show/${unrequestedShow.id}/seasons/1`,
    );
    await expect(
      page.getByRole("heading", { level: 1, name: "Season 1" }),
    ).toBeVisible();

    await page.getByRole("link", { name: /the boy savior/iu }).click();

    await expect(page).toHaveURL(
      `/details/media/show/${unrequestedShow.id}/seasons/1/episodes/7`,
    );
    await expect(
      page.getByRole("heading", { level: 1, name: "The Boy Savior" }),
    ).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("heading", { name: "Hailee Steinfeld" }),
    ).toBeVisible();
  });
});
