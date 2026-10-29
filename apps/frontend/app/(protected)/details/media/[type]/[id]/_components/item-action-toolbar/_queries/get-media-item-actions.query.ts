import { gql } from "@apollo/client";

import type {
  GetMediaItemActionsQuery,
  GetMediaItemActionsQueryVariables,
} from "./get-media-item-actions.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_MEDIA_ITEM_ACTIONS: TypedDocumentNode<
  GetMediaItemActionsQuery,
  GetMediaItemActionsQueryVariables
> = gql`
  query GetMediaItemActions(
    $tmdbId: String
    $tvdbId: String
    $type: MediaItemType!
    $episodeNumber: Int
    $seasonNumber: Int
  ) {
    itemRequestByExternalIds(tmdbId: $tmdbId, tvdbId: $tvdbId) {
      id
      seasons
      mediaItem(
        type: $type
        episodeNumber: $episodeNumber
        seasonNumber: $seasonNumber
      ) {
        ... on MediaItem {
          id
          availableActions
        }
      }
    }
  }
`;
