import { REQUEST_ITEM } from "#app/(protected)/details/media/[type]/[id]/_components/item-action-toolbar/actions/request-item/_mutations/request-item.mutation.ts";
import { unrequestedMovie } from "#app/(protected)/details/media/[type]/[id]/media-details.fixtures.ts";
import { api } from "#mocks/graphql.ts";
import {
  mockItemRequestChanges,
  mockItemState,
  mockMediaItemQuery,
  mockRequestedMovie,
  unrequestedMovieHandlers,
} from "#mocks/handlers/media-details.handler.ts";
import {
  HttpResponse,
  expect,
  test,
  withHandlers,
} from "#playwright/fixtures.ts";
import { waitForHydration } from "#playwright/wait-for-hydration.ts";

import type { AnyHandler } from "msw";

test.use({ signedInAs: "user" });

// The movie's media item once it's been requested
const requestedMovieItem = Object.freeze({
  id: "requested-movie",
  state: "indexed",
  isRequested: true,
} as const);

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

// Stays mocked until phase 3 runs the request pipeline against a real Riven
test.use({ handlers: withHandlers(...unrequestedMovieHandlers) });

test("requesting the movie shows its state as it changes", async ({
  network,
  page,
}) => {
  const movieState = mockMovieRequest(network);

  await page.goto(`/details/media/movie/${unrequestedMovie.id}`);

  const requestButton = page.getByRole("button", { name: "Request" });

  await waitForHydration(requestButton);
  await requestButton.click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Request" })
    .click();

  await expect(page.getByText(/request successful/iu)).toBeVisible();
  await expect(page.getByRole("status", { name: "Indexed" })).toBeVisible();

  movieState.publishState("completed");

  await expect(page.getByRole("status", { name: "Completed" })).toBeVisible();
});
