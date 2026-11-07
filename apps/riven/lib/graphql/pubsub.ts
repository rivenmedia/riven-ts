import { createPubSub } from "@graphql-yoga/subscription";

import type { ExternalIds } from "@repo/util-plugin-sdk/schemas/external-ids.type";
import type { UUID } from "node:crypto";

export const pubSub = createPubSub<{
  MEDIA_ITEM_STATE_CHANGED: [mediaItemId: UUID, mediaItemId: UUID];
  SEASON_UPDATED: [seasonId: UUID, seasonId: UUID];
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
