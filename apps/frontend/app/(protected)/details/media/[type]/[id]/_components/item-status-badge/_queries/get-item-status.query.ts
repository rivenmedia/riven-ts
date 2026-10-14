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
      mediaItems {
        ... on Movie {
          state
          type
          id
        }

        ... on Show {
          state
          type
          id
        }
      }
    }
  }
`;
