import { HttpResponse } from "msw";

import { GET_MEDIA_ITEM_ACTIONS } from "#app/(protected)/details/media/[type]/[id]/_components/item-action-toolbar/_queries/get-media-item-actions.query.ts";
import { ON_ITEM_REQUEST_CHANGED } from "#app/(protected)/details/media/[type]/[id]/_components/item-action-toolbar/_subscriptions/on-item-request-changed.subscription.ts";
import { GET_ITEM_CAST } from "#app/(protected)/details/media/[type]/[id]/_components/item-cast/_queries/get-item-cast.query.ts";
import { GET_ITEM_RECOMMENDATIONS } from "#app/(protected)/details/media/[type]/[id]/_components/item-recommendations/_queries/get-item-recommendations.query.ts";
import { GET_ITEM_SEASON_STATES } from "#app/(protected)/details/media/[type]/[id]/_components/item-seasons/_queries/get-item-season-states.query.ts";
import { GET_ITEM_SEASONS } from "#app/(protected)/details/media/[type]/[id]/_components/item-seasons/_queries/get-item-seasons.query.ts";
import { ON_SEASON_UPDATED } from "#app/(protected)/details/media/[type]/[id]/_components/item-seasons/_subscriptions/on-season-updated.subscription.ts";
import { GET_SIMILAR_ITEMS } from "#app/(protected)/details/media/[type]/[id]/_components/similar-items/_queries/get-similar-items.query.ts";
import {
  movieCast,
  movieRecommendations,
  movieSimilarItems,
  showCast,
  unrequestedMovie,
  unrequestedShow,
} from "#app/(protected)/details/media/[type]/[id]/media-details.fixtures.ts";
import { GET_ITEM_STATE } from "#components/item-state-badge/_queries/get-item-state.query.ts";
import { ON_MEDIA_ITEM_STATE_CHANGED } from "#components/item-state-badge/_subscriptions/on-media-item-state-changed.subscription.ts";
import { api } from "#mocks/graphql.ts";

import type { GetItemCastQuery } from "#app/(protected)/details/media/[type]/[id]/_components/item-cast/_queries/get-item-cast.query.typegen.ts";
import type { GetItemRecommendationsQuery } from "#app/(protected)/details/media/[type]/[id]/_components/item-recommendations/_queries/get-item-recommendations.query.typegen.ts";
import type { SeasonState } from "#app/(protected)/details/media/[type]/[id]/_components/item-seasons/_components/season-card/season-card.tsx";
import type { GetItemSeasonStatesQuery } from "#app/(protected)/details/media/[type]/[id]/_components/item-seasons/_queries/get-item-season-states.query.typegen.ts";
import type { GetSimilarItemsQuery } from "#app/(protected)/details/media/[type]/[id]/_components/similar-items/_queries/get-similar-items.query.typegen.ts";
import type { GetMediaItemQuery } from "#app/(protected)/details/media/[type]/[id]/_queries/get-media-item.query.typegen.ts";
import type { MediaDetailsPage } from "#app/(protected)/details/media/[type]/[id]/page.client.tsx";
import type {
  MediaItemAction,
  MediaItem,
} from "#app/_types/__generated__/graphql.ts";
import type { TypedDocumentNode } from "@apollo/client";
import type { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import type { TopLevelMediaItemType } from "@repo/util-plugin-sdk/dto/enums/top-level-media-item-type.enum";
import type { GraphQLQuery } from "msw/graphql";
import type { ComponentProps } from "react";

/**
 * Mocks a mutation on a single entity, failing it if it doesn't target the expected ID.
 *
 * @param onSuccess - Called when the mutation succeeds, e.g. to publish the resulting state change
 */
export const mockMutationWithIdEqualityCheck = <
  Mutation extends GraphQLQuery,
  Variables extends { id: string },
>(
  document: TypedDocumentNode<Mutation, Variables>,
  expectedId: string,
  data: Mutation,
  onSuccess?: () => void,
) =>
  api.mutation(document, ({ variables }) => {
    if (variables.id !== expectedId) {
      return HttpResponse.json({
        errors: [{ message: `Invalid id parameter: ${variables.id}` }],
      });
    }

    onSuccess?.();

    return HttpResponse.json({ data });
  });

export type RequestedMediaItem = Pick<
  MediaItem,
  "id" | "isRequested" | "state"
>;

/**
 * Mocks a media item's state, and the subscription to its state changes.
 *
 * @returns The mocked handlers, and a function that changes the item's state and notifies its subscribers
 */
export const mockItemState = (
  __typename: Capitalize<TopLevelMediaItemType>,
  { id, isRequested, state: initialState }: RequestedMediaItem,
) => {
  let currentState = initialState;

  const subscribers = new Set<() => void>();

  return {
    publishState: (state: MediaItemState) => {
      currentState = state;

      for (const notify of subscribers) {
        notify();
      }
    },
    handlers: [
      api.query(GET_ITEM_STATE, () =>
        HttpResponse.json({
          data: {
            mediaItemById: { __typename, isRequested, state: currentState },
          },
        }),
      ),
      api.subscription(
        ON_MEDIA_ITEM_STATE_CHANGED,
        ({ subscription, finalize }) => {
          if (subscription.variables.id !== id) {
            subscription.error([
              {
                message: `Invalid id parameter: ${subscription.variables.id}`,
              },
            ]);

            return;
          }

          const notify = () => {
            subscription.publish({
              data: {
                mediaItemStateChanged: { __typename, state: currentState },
              },
            });
          };

          subscribers.add(notify);

          finalize(() => {
            subscribers.delete(notify);
          });

          // Catch up on any changes made before the subscription was established
          if (currentState !== initialState) {
            notify();
          }
        },
      ),
    ],
  };
};

/**
 * Mocks the item request queries for a movie that has been requested.
 *
 * @returns The mocked handlers, the IDs they use, and a function to publish state changes
 */
export const mockRequestedMovie = ({
  availableActions,
  mediaItem,
  itemState = mockItemState("Movie", mediaItem),
}: {
  availableActions: MediaItemAction[];
  mediaItem: RequestedMediaItem;
  /**
   * The item's state, if it's already mocked (e.g. so its subscription is in place before the page connects)
   */
  itemState?: ReturnType<typeof mockItemState>;
}) => {
  const itemRequestId = crypto.randomUUID();
  const { id: primaryMediaItemId } = mediaItem;

  return {
    itemRequestId,
    primaryMediaItemId,
    publishState: itemState.publishState,
    handlers: [
      api.query(GET_MEDIA_ITEM_ACTIONS, () =>
        HttpResponse.json({
          data: {
            itemRequestByExternalIds: {
              __typename: "ItemRequest",
              id: itemRequestId,
              mediaItem: {
                __typename: "Movie",
                id: primaryMediaItemId,
                availableActions,
              },
              seasons: null,
            },
          },
        }),
      ),
      ...itemState.handlers,
    ],
  };
};

export const SEASON_POSTER_URLS = [
  "https://artworks.thetvdb.com/banners/v4/season/830385/posters/6187fabf54442.jpg",
  "https://artworks.thetvdb.com/banners/v4/season/2033977/posters/6791509cb5fcd.jpg",
];

export const mockItemSeasonStates = (
  itemRequest: GetItemSeasonStatesQuery["itemRequestByExternalIds"],
) =>
  api.query(GET_ITEM_SEASON_STATES, () =>
    HttpResponse.json({ data: { itemRequestByExternalIds: itemRequest } }),
  );

/**
 * Mocks a show's seasons, none of which have been indexed, and the subscription to their updates.
 */
export const mockItemSeasons = (showId: string) => [
  api.query(GET_ITEM_SEASONS, () =>
    HttpResponse.json({
      data: {
        tmdbItem: {
          __typename: "TmdbIndexerData",
          id: showId,
          type: "show",
          seasons: SEASON_POSTER_URLS.map((posterUrl, index) => {
            const number = index + 1;

            return {
              __typename: "IndexerSeason",
              id: `${showId}:season-${String(number)}`,
              number,
              title: `Season ${String(number)}`,
              posterUrl,
              episodes: Array.from({ length: 9 }).map((_, episodeIndex) => ({
                __typename: "IndexerEpisode",
                id: `${showId}:season-${String(number)}:episode-${String(episodeIndex + 1)}`,
                number: episodeIndex + 1,
                title: `Episode ${String(episodeIndex + 1)}`,
                posterUrl: null,
              })),
            };
          }),
        },
      },
    }),
  ),
  mockItemSeasonStates(null),
  api.subscription(ON_SEASON_UPDATED, () => {
    // The seasons don't change
  }),
];

/**
 * Mocks the item request queries for a show that has been requested.
 *
 * @returns The mocked handlers, the IDs they use, and a function to publish state changes
 */
export const mockRequestedShow = ({
  availableActions,
  mediaItem,
  seasons,
}: {
  availableActions: MediaItemAction[];
  mediaItem: RequestedMediaItem;
  /**
   * The state of each season's media item, or `null` if the season hasn't been indexed
   */
  seasons: (SeasonState | null)[];
}) => {
  const itemRequestId = crypto.randomUUID();
  const primaryMediaItemId = mediaItem.id;
  const itemState = mockItemState("Show", mediaItem);

  return {
    itemRequestId,
    primaryMediaItemId,
    publishState: itemState.publishState,
    handlers: [
      api.query(GET_MEDIA_ITEM_ACTIONS, () =>
        HttpResponse.json({
          data: {
            itemRequestByExternalIds: {
              __typename: "ItemRequest",
              id: itemRequestId,
              mediaItem: {
                __typename: "Show",
                id: primaryMediaItemId,
                availableActions,
              },
              seasons: null,
            },
          },
        }),
      ),
      mockItemSeasonStates({
        __typename: "ItemRequest",
        id: itemRequestId,
        primaryMediaItem: {
          __typename: "Show",
          id: primaryMediaItemId,
          seasons: seasons.flatMap((season, index) =>
            season
              ? [
                  {
                    __typename: "Season",
                    id: crypto.randomUUID(),
                    number: index + 1,
                    ...season,
                  },
                ]
              : [],
          ),
        },
      }),
      ...itemState.handlers,
    ],
  };
};

export type MediaDetailsData = ComponentProps<typeof MediaDetailsPage>["data"];

/**
 * How long Riven takes to process an item request in the background.
 *
 * Changes are published after this, so the mutation that triggered them has responded first, as it would in reality.
 */
export const ITEM_REQUEST_PROCESSING_MS = 100;

/**
 * Mocks the subscription to changes in the item's request.
 *
 * @returns The mocked handler, and a function that publishes a change once the request has been processed
 */
export const mockItemRequestChanges = (externalId: string) => {
  const subscribers = new Set<(itemRequestId: string) => void>();

  return {
    publishChange: (itemRequestId: string) => {
      setTimeout(() => {
        for (const notify of subscribers) {
          notify(itemRequestId);
        }
      }, ITEM_REQUEST_PROCESSING_MS);
    },
    handler: api.subscription(
      ON_ITEM_REQUEST_CHANGED,
      ({ subscription, finalize }) => {
        const { tmdbId, tvdbId } = subscription.variables;

        if ((tmdbId ?? tvdbId) !== externalId) {
          subscription.error([
            { message: `Invalid external ID: ${String(tmdbId ?? tvdbId)}` },
          ]);

          return;
        }

        const notify = (itemRequestId: string) => {
          subscription.publish({ data: { itemRequestChanged: itemRequestId } });
        };

        subscribers.add(notify);

        finalize(() => {
          subscribers.delete(notify);
        });
      },
    ),
  };
};

/**
 * Mocks the item query the route renders the page with, which is re-fetched when the page refreshes.
 *
 * Matched by name, as the stories' data has the page's props type, which is looser than the query's.
 */
export const mockMediaItemQuery = (
  data: MediaDetailsData,
  mediaItem: GetMediaItemQuery["tmdbItem"]["mediaItem"],
) =>
  api.query("GetMediaItem", () =>
    HttpResponse.json({
      data: {
        tmdbItem: { ...data, __typename: "TmdbIndexerData", mediaItem },
      },
    }),
  );

type IndexedItem = Pick<MediaDetailsData, "id" | "type">;

/** Mocks an item's cast */
export const mockItemCast = (
  { id, type }: IndexedItem,
  cast: GetItemCastQuery["tmdbItem"]["cast"],
) =>
  api.query(GET_ITEM_CAST, () =>
    HttpResponse.json({
      data: { tmdbItem: { __typename: "TmdbIndexerData", id, type, cast } },
    }),
  );

/** Mocks the items recommended alongside an item */
export const mockItemRecommendations = (
  { id, type }: IndexedItem,
  recommendations: GetItemRecommendationsQuery["tmdbItem"]["recommendations"],
) =>
  api.query(GET_ITEM_RECOMMENDATIONS, () =>
    HttpResponse.json({
      data: {
        tmdbItem: { __typename: "TmdbIndexerData", id, type, recommendations },
      },
    }),
  );

/** Mocks the items similar to an item */
export const mockSimilarItems = (
  { id, type }: IndexedItem,
  similarItems: GetSimilarItemsQuery["tmdbItem"]["similarItems"],
) =>
  api.query(GET_SIMILAR_ITEMS, () =>
    HttpResponse.json({
      data: {
        tmdbItem: { __typename: "TmdbIndexerData", id, type, similarItems },
      },
    }),
  );

/**
 * Mocks an item that hasn't been requested, along with the details shown alongside it.
 */
const mockUnrequestedItem = (
  data: MediaDetailsData,
  {
    cast,
    recommendations,
    similarItems,
  }: {
    cast: GetItemCastQuery["tmdbItem"]["cast"];
    recommendations: GetItemRecommendationsQuery["tmdbItem"]["recommendations"];
    similarItems: GetSimilarItemsQuery["tmdbItem"]["similarItems"];
  },
) => [
  mockMediaItemQuery(data, null),
  mockItemCast(data, cast),
  mockItemRecommendations(data, recommendations),
  mockSimilarItems(data, similarItems),
  api.query(GET_MEDIA_ITEM_ACTIONS, () =>
    HttpResponse.json({ data: { itemRequestByExternalIds: null } }),
  ),
];

/**
 * The unrequested movie, with its cast, recommendations and similar items.
 *
 * The details are cached by the server, so tests must mock the same details for the same item.
 */
export const unrequestedMovieHandlers = mockUnrequestedItem(unrequestedMovie, {
  cast: movieCast,
  recommendations: movieRecommendations,
  similarItems: movieSimilarItems,
});

/**
 * The unrequested show, with its cast and seasons.
 *
 * The details are cached by the server, so tests must mock the same details for the same item.
 */
export const unrequestedShowHandlers = [
  ...mockUnrequestedItem(unrequestedShow, {
    cast: showCast,
    recommendations: [],
    similarItems: [],
  }),
  ...mockItemSeasons(unrequestedShow.id),
];
