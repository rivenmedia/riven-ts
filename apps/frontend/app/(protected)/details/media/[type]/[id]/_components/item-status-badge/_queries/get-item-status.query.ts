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
  query GetItemStatus($tmdbId: String!) {
    itemRequestByExternalIds(tmdbId: $tmdbId) {
      id
      primaryMediaItem {
        ... on MediaItem {
          state
          type
          id
        }
      }
    }
  }
`;
