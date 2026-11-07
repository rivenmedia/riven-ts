import { gql } from "@apollo/client";

import type {
  PauseItemMutation,
  PauseItemMutationVariables,
} from "./pause-item.mutation.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const PAUSE_ITEM: TypedDocumentNode<
  PauseItemMutation,
  PauseItemMutationVariables
> = gql`
  mutation PauseItem($id: ID!) {
    pauseMediaItem(mediaItemId: $id) {
      ... on MediaItem {
        id
        state
      }
    }
  }
`;
