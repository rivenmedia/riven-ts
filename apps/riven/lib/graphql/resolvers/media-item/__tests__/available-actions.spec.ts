import { MediaItem, Season } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

import { gql } from "@apollo/client";
import { expect } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";

import type {
  MediaItemResolverSpecGetAvailableActionsQuery,
  MediaItemResolverSpecGetAvailableActionsQueryVariables,
} from "./available-actions.spec.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";
import type { UUID } from "node:crypto";

const GET_MEDIA_ITEM_AVAILABLE_ACTIONS: TypedDocumentNode<
  MediaItemResolverSpecGetAvailableActionsQuery,
  MediaItemResolverSpecGetAvailableActionsQueryVariables
> = gql`
  query MediaItemResolverSpecGetAvailableActions($id: ID!) {
    mediaItemById(id: $id) {
      ... on MediaItem {
        availableActions
      }
    }
  }
`;

const it = baseIt
  .extend(
    "getAvailableActions",
    ({ gqlContext, gqlServer }) =>
      async (id: UUID) => {
        const { body } = await gqlServer.executeOperation<
          MediaItemResolverSpecGetAvailableActionsQuery,
          MediaItemResolverSpecGetAvailableActionsQueryVariables
        >(
          { query: GET_MEDIA_ITEM_AVAILABLE_ACTIONS, variables: { id } },
          { contextValue: gqlContext },
        );

        expect.assert(body.kind === "single");
        expect.assert(body.singleResult.data?.mediaItemById);

        return body.singleResult.data.mediaItemById.availableActions;
      },
  )
  .extend(
    "setMediaItemState",
    ({ em }) =>
      async (id: UUID, state: MediaItemState) => {
        // Bypasses the state subscriber, which would otherwise recompute the state on flush
        await em.nativeUpdate(MediaItem, { id }, { state });
      },
  );

const pausableStates = [
  "indexed",
  "scraped",
  "downloaded",
  "partially_completed",
] as const satisfies MediaItemState[];

const nonPausableStates = MediaItemState.exclude(pausableStates).options;

it("returns reset, blacklist_active_stream and delete for a completed movie", async ({
  completedMovieContext: { completedMovie },
  getAvailableActions,
}) => {
  await expect(getAvailableActions(completedMovie.id)).resolves.toStrictEqual([
    "reset",
    "blacklist_active_stream",
    "delete",
  ]);
});

it("returns reset, pause and delete for a scraped movie", async ({
  scrapedMovieContext: { scrapedMovie },
  getAvailableActions,
}) => {
  await expect(getAvailableActions(scrapedMovie.id)).resolves.toStrictEqual([
    "reset",
    "pause",
    "delete",
  ]);
});

it("returns reset, request_more and delete for a completed partially requested show", async ({
  seeders: { seedPartiallyRequestedShow },
  getAvailableActions,
}) => {
  const { show } = await seedPartiallyRequestedShow();

  await expect(getAvailableActions(show.id)).resolves.toStrictEqual([
    "reset",
    "request_more",
    "delete",
  ]);
});

it("returns no actions when the media item has not been requested", async ({
  em,
  seeders: { seedPartiallyRequestedShow },
  getAvailableActions,
}) => {
  const { show } = await seedPartiallyRequestedShow();
  const unrequestedSeason = await em.findOneOrFail(Season, {
    show,
    isRequested: false,
  });

  await expect(
    getAvailableActions(unrequestedSeason.id),
  ).resolves.toStrictEqual([]);
});

it('does not include "delete" for an episode', async ({
  completedShowContext: {
    episodes: [episode],
  },
  getAvailableActions,
}) => {
  expect.assert(episode);

  await expect(getAvailableActions(episode.id)).resolves.not.toContain(
    "delete",
  );
});

it('does not include "delete" for a season', async ({
  completedShowContext: {
    seasons: [season],
  },
  getAvailableActions,
}) => {
  expect.assert(season);

  await expect(getAvailableActions(season.id)).resolves.not.toContain("delete");
});

it('does not include "blacklist_active_stream" when the media item has no active stream', async ({
  scrapedMovieContext: { scrapedMovie },
  getAvailableActions,
}) => {
  await expect(getAvailableActions(scrapedMovie.id)).resolves.not.toContain(
    "blacklist_active_stream",
  );
});

it('includes "retry" when the media item has failed', async ({
  indexedMovieContext: { indexedMovie },
  getAvailableActions,
  setMediaItemState,
}) => {
  await setMediaItemState(indexedMovie.id, "failed");

  await expect(getAvailableActions(indexedMovie.id)).resolves.toContain(
    "retry",
  );
});

it.for(MediaItemState.exclude(["failed"]).options)(
  'does not include "retry" when the media item is %s',
  async (
    state,
    {
      indexedMovieContext: { indexedMovie },
      getAvailableActions,
      setMediaItemState,
    },
  ) => {
    await setMediaItemState(indexedMovie.id, state);

    await expect(getAvailableActions(indexedMovie.id)).resolves.not.toContain(
      "retry",
    );
  },
);

it.for(pausableStates)(
  'includes "pause" when the media item is %s',
  async (
    state,
    {
      indexedMovieContext: { indexedMovie },
      getAvailableActions,
      setMediaItemState,
    },
  ) => {
    await setMediaItemState(indexedMovie.id, state);

    await expect(getAvailableActions(indexedMovie.id)).resolves.toContain(
      "pause",
    );
  },
);

it.for(nonPausableStates)(
  'does not include "pause" when the media item is %s',
  async (
    state,
    {
      indexedMovieContext: { indexedMovie },
      getAvailableActions,
      setMediaItemState,
    },
  ) => {
    await setMediaItemState(indexedMovie.id, state);

    await expect(getAvailableActions(indexedMovie.id)).resolves.not.toContain(
      "pause",
    );
  },
);

it('includes "resume" when the media item is paused', async ({
  indexedMovieContext: { indexedMovie },
  getAvailableActions,
  setMediaItemState,
}) => {
  await setMediaItemState(indexedMovie.id, "paused");

  await expect(getAvailableActions(indexedMovie.id)).resolves.toContain(
    "resume",
  );
});

it.for(MediaItemState.exclude(["paused"]).options)(
  'does not include "resume" when the media item is %s',
  async (
    state,
    {
      indexedMovieContext: { indexedMovie },
      getAvailableActions,
      setMediaItemState,
    },
  ) => {
    await setMediaItemState(indexedMovie.id, state);

    await expect(getAvailableActions(indexedMovie.id)).resolves.not.toContain(
      "resume",
    );
  },
);

it('does not include "request_more" when every season of a show has been requested', async ({
  completedShowContext: { completedShow },
  getAvailableActions,
}) => {
  await expect(getAvailableActions(completedShow.id)).resolves.not.toContain(
    "request_more",
  );
});
