import { gql } from "@apollo/client";

import type {
  RivenTuiResetMediaItemMutation,
  RivenTuiResetMediaItemMutationVariables,
} from "./reset-media-item.mutation.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const RESET_MEDIA_ITEM: TypedDocumentNode<
  RivenTuiResetMediaItemMutation,
  RivenTuiResetMediaItemMutationVariables
> = gql`
  mutation RivenTuiResetMediaItem($mediaItemId: ID!) {
    resetMediaItem(mediaItemId: $mediaItemId) {
      ... on MediaItem {
        id
      }
    }
  }
`;
