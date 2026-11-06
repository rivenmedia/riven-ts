import { gql } from "@apollo/client";

import type {
  ResetItemMutation,
  ResetItemMutationVariables,
} from "./reset-item.mutation.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const RESET_ITEM: TypedDocumentNode<
  ResetItemMutation,
  ResetItemMutationVariables
> = gql`
  mutation ResetItem($id: ID!) {
    resetMediaItem(mediaItemId: $id) {
      ... on MediaItem {
        id
        state
      }
    }
  }
`;
