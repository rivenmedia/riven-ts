import { gql } from "@apollo/client";

import type {
  GetItemStatusQuery,
  GetItemStatusQueryVariables,
} from "./get-item-status.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_ITEM_STATUS: TypedDocumentNode<
  GetItemStatusQuery,
  GetItemStatusQueryVariables
> = gql`
  query GetItemStatus(
    $tvdbId: String
    $tmdbId: String
    $type: MediaItemType!
    $seasonNumber: Int
    $episodeNumber: Int
  ) {
    itemRequestByExternalIds(tvdbId: $tvdbId, tmdbId: $tmdbId) {
      id
      mediaItem(
        type: $type
        seasonNumber: $seasonNumber
        episodeNumber: $episodeNumber
      ) {
        ... on MediaItem {
          state
          type
          id
          isRequested
        }
      }
    }
  }
`;
