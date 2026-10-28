import { gql } from "@apollo/client";

import type {
  GetItemRequestActionsQuery,
  GetItemRequestActionsQueryVariables,
} from "./get-item-request-actions.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_ITEM_REQUEST_ACTIONS: TypedDocumentNode<
  GetItemRequestActionsQuery,
  GetItemRequestActionsQueryVariables
> = gql`
  query GetItemRequestActions(
    $tmdbId: String
    $tvdbId: String
    $type: MediaItemType!
    $episodeNumber: Int
    $seasonNumber: Int
  ) {
    itemRequestByExternalIds(tmdbId: $tmdbId, tvdbId: $tvdbId) {
      id
      seasons
      availableActions
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
