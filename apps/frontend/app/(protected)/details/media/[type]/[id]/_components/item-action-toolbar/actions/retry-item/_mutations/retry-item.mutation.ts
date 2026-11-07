import { gql } from "@apollo/client";

import type {
  RetryItemMutation,
  RetryItemMutationVariables,
} from "./retry-item.mutation.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const RETRY_ITEM: TypedDocumentNode<
  RetryItemMutation,
  RetryItemMutationVariables
> = gql`
  mutation RetryItem($id: ID!) {
    retryMediaItem(mediaItemId: $id) {
      ... on MediaItem {
        id
        state
      }
    }
  }
`;
