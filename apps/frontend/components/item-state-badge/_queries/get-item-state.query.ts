import { gql } from "@apollo/client";

import type {
  GetItemStateQuery,
  GetItemStateQueryVariables,
} from "./get-item-state.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_ITEM_STATE: TypedDocumentNode<
  GetItemStateQuery,
  GetItemStateQueryVariables
> = gql`
  query GetItemState($id: ID!) {
    mediaItemById(id: $id) {
      ... on MediaItem {
        state
        isRequested
      }
    }
  }
`;
