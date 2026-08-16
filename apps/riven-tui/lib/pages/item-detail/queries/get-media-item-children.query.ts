import { gql } from "@apollo/client";

import type {
  RivenTuiGetMediaItemChildrenQuery,
  RivenTuiGetMediaItemChildrenQueryVariables,
} from "./get-media-item-children.query.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_MEDIA_ITEM_CHILDREN: TypedDocumentNode<
  RivenTuiGetMediaItemChildrenQuery,
  RivenTuiGetMediaItemChildrenQueryVariables
> = gql`
  query RivenTuiGetMediaItemChildren($mediaItemId: ID!) {
    mediaItemById(id: $mediaItemId) {
      ... on MediaItem {
        isRequested
      }

      ... on Show {
        seasons(includeUnrequestedSeasons: true) {
          id
          title
          number
          state
          type
        }
      }

      ... on Season {
        episodes {
          id
          number
          state
          title
          type
        }
      }
    }
  }
`;
