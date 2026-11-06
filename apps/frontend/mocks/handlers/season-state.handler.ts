import { HttpResponse } from "msw";

import { GET_MEDIA_ITEM_ACTIONS } from "#app/(protected)/details/media/[type]/[id]/_components/item-action-toolbar/_queries/get-media-item-actions.query.ts";
import { ON_ITEM_REQUEST_CHANGED } from "#app/(protected)/details/media/[type]/[id]/_components/item-action-toolbar/_subscriptions/on-item-request-changed.subscription.ts";
import { GET_SEASON_STATE } from "#app/(protected)/details/media/[type]/[id]/seasons/[seasonNumber]/_queries/get-season-state.query.ts";
import { ON_SEASON_EPISODES_UPDATED } from "#app/(protected)/details/media/[type]/[id]/seasons/[seasonNumber]/_subscriptions/on-season-episodes-updated.subscription.ts";
import { ON_MEDIA_ITEM_STATE_CHANGED } from "#components/item-state-badge/_subscriptions/on-media-item-state-changed.subscription.ts";
import { api } from "#mocks/graphql.ts";

import type { GetMediaItemActionsQueryVariables } from "#app/(protected)/details/media/[type]/[id]/_components/item-action-toolbar/_queries/get-media-item-actions.query.typegen.ts";
import type { MediaItemAction } from "@repo/util-plugin-sdk/dto/enums/media-item-action.enum";
import type { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

interface MockedItemState {
  id: string;
  isRequested: boolean;
  state: MediaItemState;
}

export interface MockedSeasonState extends MockedItemState {
  number: number;
  /**
   * The state of each indexed episode, keyed by episode number.
   */
  episodes: Map<number, MockedItemState>;
}

const toEpisodes = (
  { episodes }: MockedSeasonState,
  changes = new Map<number, MediaItemState>(),
) =>
  [...episodes].map(([number, { id, isRequested, state }]) => ({
    __typename: "Episode" as const,
    id,
    number,
    isRequested,
    state: changes.get(number) ?? state,
  }));

/**
 * Mirrors the actions Riven makes available for a season or episode.
 */
const toAvailableActions = ({
  isRequested,
  state,
}: MockedItemState): MediaItemAction[] => {
  if (!isRequested) {
    return [];
  }

  return [
    "reset",
    ...(state === "failed" ? (["retry"] as const) : []),
    ...(["failed", "completed", "paused", "unreleased"].includes(state)
      ? []
      : (["pause"] as const)),
    ...(state === "paused" ? (["resume"] as const) : []),
  ];
};

/**
 * Resolves the season or episode that the item actions are queried for.
 */
const toMediaItem = (
  seasonState: MockedSeasonState,
  { type, seasonNumber, episodeNumber }: GetMediaItemActionsQueryVariables,
) => {
  if (seasonNumber !== seasonState.number) {
    return null;
  }

  if (type === "season") {
    return {
      __typename: "Season" as const,
      id: seasonState.id,
      availableActions: toAvailableActions(seasonState),
    };
  }

  const episode =
    type === "episode" && episodeNumber != null
      ? seasonState.episodes.get(episodeNumber)
      : undefined;

  return episode
    ? {
        __typename: "Episode" as const,
        id: episode.id,
        availableActions: toAvailableActions(episode),
      }
    : null;
};

/**
 * Mocks the Riven state of a season and its episodes, their available actions, and the subscriptions
 * to their changes. A `null` season state mocks a season that hasn't been indexed.
 *
 * @param episodeStateChanges The episode states, keyed by episode number, to publish once subscribed to
 */
export function createSeasonStateHandlers(
  seasonState: MockedSeasonState | null,
  episodeStateChanges = new Map<number, MediaItemState>(),
) {
  return [
    api.query(GET_SEASON_STATE, () =>
      HttpResponse.json({
        data: {
          itemRequestByExternalIds: seasonState && {
            __typename: "ItemRequest",
            id: crypto.randomUUID(),
            primaryMediaItem: {
              __typename: "Show",
              id: crypto.randomUUID(),
              season: {
                __typename: "Season",
                id: seasonState.id,
                number: seasonState.number,
                isRequested: seasonState.isRequested,
                state: seasonState.state,
                episodes: toEpisodes(seasonState),
              },
            },
          },
        },
      }),
    ),
    api.query(GET_MEDIA_ITEM_ACTIONS, ({ variables }) => {
      if (!seasonState) {
        return HttpResponse.json({ data: { itemRequestByExternalIds: null } });
      }

      return HttpResponse.json({
        data: {
          itemRequestByExternalIds: {
            __typename: "ItemRequest",
            id: crypto.randomUUID(),
            seasons: [seasonState.number],
            mediaItem: toMediaItem(seasonState, variables),
          },
        },
      });
    }),
    api.subscription(ON_ITEM_REQUEST_CHANGED, () => {
      // The item request doesn't change
    }),
    api.subscription(ON_MEDIA_ITEM_STATE_CHANGED, ({ subscription }) => {
      const changedEpisode =
        seasonState &&
        toEpisodes(seasonState, episodeStateChanges).find(
          ({ id, number }) =>
            id === subscription.variables.id && episodeStateChanges.has(number),
        );

      if (changedEpisode) {
        subscription.publish({
          data: {
            mediaItemStateChanged: {
              __typename: "Episode",
              state: changedEpisode.state,
            },
          },
        });
      }
    }),
    api.subscription(ON_SEASON_EPISODES_UPDATED, ({ subscription }) => {
      if (!seasonState || subscription.variables.id !== seasonState.id) {
        subscription.error([
          { message: `Invalid id parameter: ${subscription.variables.id}` },
        ]);

        return;
      }

      if (episodeStateChanges.size > 0) {
        subscription.publish({
          data: {
            seasonUpdated: {
              __typename: "Season",
              id: seasonState.id,
              episodes: toEpisodes(seasonState, episodeStateChanges),
            },
          },
        });
      }
    }),
  ];
}
