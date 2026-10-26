import { createPubSub } from "@graphql-yoga/subscription";

import type { MediaItemState } from "#types/__generated__/graphql.ts";
import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import type { ExternalIds } from "@repo/util-plugin-sdk/schemas/external-ids.type";
import type { UUID } from "node:crypto";

export const pubSub = createPubSub<{
  MEDIA_ITEM_STATE_CHANGED: [
    mediaItemId: UUID,
    {
      item: MediaItem;
      stateChange: [oldState: MediaItemState, newState: MediaItemState];
    },
  ];
  ITEM_REQUEST_CHANGED: [externalIdTopic: string, itemRequestId: UUID];
}>();

/**
 * Builds the `ITEM_REQUEST_CHANGED` topic IDs for each of the given external IDs, e.g. `tmdb:123`.
 */
export const getExternalIdTopics = ({ tmdbId, tvdbId, imdbId }: ExternalIds) =>
  [
    tmdbId && `tmdb:${tmdbId}`,
    tvdbId && `tvdb:${tvdbId}`,
    imdbId && `imdb:${imdbId}`,
  ].filter((topic) => typeof topic === "string");
