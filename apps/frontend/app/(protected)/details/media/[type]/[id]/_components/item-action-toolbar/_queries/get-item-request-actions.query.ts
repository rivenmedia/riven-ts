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
  query GetItemRequestActions($tmdbId: String, $tvdbId: String) {
    itemRequestByExternalIds(tmdbId: $tmdbId, tvdbId: $tvdbId) {
      id
      seasons
      availableActions
      primaryMediaItem {
        ... on MediaItem {
          id
        }
      }
    }
  }
`;
