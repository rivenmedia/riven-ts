import { gql } from "@apollo/client";

import type {
  RivenTuiGetLibraryItemsQuery,
  RivenTuiGetLibraryItemsQueryVariables,
} from "./get-library-items.query.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_LIBRARY_ITEMS: TypedDocumentNode<
  RivenTuiGetLibraryItemsQuery,
  RivenTuiGetLibraryItemsQueryVariables
> = gql`
  query RivenTuiGetLibraryItems(
    $type: [MediaItemType!]!
    $limit: Int!
    $page: Int!
  ) {
    mediaItems(type: $type, limit: $limit, page: $page) {
      ... on MediaItem {
        id
        fullTitle
        state
      }
    }
  }
`;
