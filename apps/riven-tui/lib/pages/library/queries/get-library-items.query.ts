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
    $after: String
    $itemsPerPage: Int
  ) {
    mediaItems(type: $type, after: $after, itemsPerPage: $itemsPerPage) {
      hasNextPage
      hasPrevPage
      endCursor
      startCursor
      totalCount
      length
      items {
        ... on MediaItem {
          id
          fullTitle
          state
        }
      }
    }
  }
`;
