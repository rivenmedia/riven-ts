import { ItemRequestState } from "@repo/util-plugin-sdk/dto/enums/item-request-state.enum";

import { gql } from "@apollo/client";
import { expect } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";

import type {
  ItemRequestResolverSpecGetAvailableActionsQuery,
  ItemRequestResolverSpecGetAvailableActionsQueryVariables,
} from "./available-actions.spec.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

const GET_ITEM_REQUEST_AVAILABLE_ACTIONS: TypedDocumentNode<
  ItemRequestResolverSpecGetAvailableActionsQuery,
  ItemRequestResolverSpecGetAvailableActionsQueryVariables
> = gql`
  query ItemRequestResolverSpecGetAvailableActions(
    $tmdbId: String
    $tvdbId: String
  ) {
    itemRequestByExternalIds(tmdbId: $tmdbId, tvdbId: $tvdbId) {
      availableActions
    }
  }
`;

const it = baseIt.extend(
  "getAvailableActions",
  ({ gqlContext, gqlServer }) =>
    async (
      variables: ItemRequestResolverSpecGetAvailableActionsQueryVariables,
    ) => {
      const { body } = await gqlServer.executeOperation<
        ItemRequestResolverSpecGetAvailableActionsQuery,
        ItemRequestResolverSpecGetAvailableActionsQueryVariables
      >(
        { query: GET_ITEM_REQUEST_AVAILABLE_ACTIONS, variables },
        { contextValue: gqlContext },
      );

      expect.assert(body.kind === "single");
      expect.assert(body.singleResult.data?.itemRequestByExternalIds);

      return body.singleResult.data.itemRequestByExternalIds.availableActions;
    },
);

const pausableStates = [
  "requested",
  "ongoing",
  "processing",
] as const satisfies ItemRequestState[];

const nonPausableStates = ItemRequestState.exclude(pausableStates).options;

it("returns reset, delete, and blacklist_active_stream for a completed movie", async ({
  completedMovieContext: { completedMovie },
  getAvailableActions,
}) => {
  await expect(
    getAvailableActions({ tmdbId: completedMovie.tmdbId }),
  ).resolves.toStrictEqual(["reset", "blacklist_active_stream", "delete"]);
});

it("returns reset, pause and delete for a movie that is being processed", async ({
  scrapedMovieContext: { scrapedMovie },
  getAvailableActions,
}) => {
  await expect(
    getAvailableActions({ tmdbId: scrapedMovie.tmdbId }),
  ).resolves.toStrictEqual(["reset", "pause", "delete"]);
});

it("returns reset, request_more and delete for a completed partially requested show", async ({
  seeders: { seedPartiallyRequestedShow },
  getAvailableActions,
}) => {
  const { show } = await seedPartiallyRequestedShow();

  await expect(
    getAvailableActions({ tvdbId: show.tvdbId }),
  ).resolves.toStrictEqual(["reset", "request_more", "delete"]);
});

it('includes "retry" when the primary media item has failed', async ({
  em,
  seeders: { seedIndexedMovie },
  getAvailableActions,
}) => {
  const { movie } = await seedIndexedMovie();

  em.persist(movie);

  movie.state = "failed";

  await em.flush();

  await expect(
    getAvailableActions({ tmdbId: movie.tmdbId }),
  ).resolves.toContain("retry");
});

it('does not include "retry" when the primary media item has not failed', async ({
  indexedMovieContext: { indexedMovie },
  getAvailableActions,
}) => {
  await expect(
    getAvailableActions({ tmdbId: indexedMovie.tmdbId }),
  ).resolves.not.toContain("retry");
});

it.for(pausableStates)(
  'includes "pause" when the item request is %s',
  async (
    state,
    { em, scrapedMovieContext: { scrapedMovie }, getAvailableActions },
  ) => {
    const itemRequest = scrapedMovie.itemRequest.getEntity();

    em.persist(itemRequest).assign(itemRequest, { state });

    await em.flush();

    await expect(
      getAvailableActions({ tmdbId: scrapedMovie.tmdbId }),
    ).resolves.toContain("pause");
  },
);

it.for(nonPausableStates)(
  'does not include "pause" when the item request is %s',
  async (
    state,
    { em, scrapedMovieContext: { scrapedMovie }, getAvailableActions },
  ) => {
    const itemRequest = scrapedMovie.itemRequest.getEntity();

    em.persist(itemRequest).assign(itemRequest, { state });

    await em.flush();

    await expect(
      getAvailableActions({ tmdbId: scrapedMovie.tmdbId }),
    ).resolves.not.toContain("pause");
  },
);

it('includes "resume" when the item request is paused', async ({
  em,
  scrapedMovieContext: { scrapedMovie },
  getAvailableActions,
}) => {
  const itemRequest = scrapedMovie.itemRequest.getEntity();

  em.persist(itemRequest).assign(itemRequest, { state: "paused" });

  await em.flush();

  await expect(
    getAvailableActions({ tmdbId: scrapedMovie.tmdbId }),
  ).resolves.toContain("resume");
});

it.for(ItemRequestState.exclude(["paused"]).options)(
  'does not include "resume" when the item request is %s',
  async (
    state,
    { em, scrapedMovieContext: { scrapedMovie }, getAvailableActions },
  ) => {
    const itemRequest = scrapedMovie.itemRequest.getEntity();

    em.persist(itemRequest).assign(itemRequest, { state });

    await em.flush();

    await expect(
      getAvailableActions({ tmdbId: scrapedMovie.tmdbId }),
    ).resolves.not.toContain("resume");
  },
);

it('does not include "request_more" when every season of a show has been requested', async ({
  completedShowContext: { completedShow },
  getAvailableActions,
}) => {
  await expect(
    getAvailableActions({ tvdbId: completedShow.tvdbId }),
  ).resolves.not.toContain("request_more");
});
