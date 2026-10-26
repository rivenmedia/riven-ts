import { gql } from "@apollo/client";

import type {
  GetLibraryItemsQuery,
  GetLibraryItemsQueryVariables,
} from "./get-library-items.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_LIBRARY_ITEMS: TypedDocumentNode<
  GetLibraryItemsQuery,
  GetLibraryItemsQueryVariables
> = gql`
  query GetLibraryItems(
    $after: String
    $search: String
    $type: [MediaItemType!]
    $state: [MediaItemState!]
  ) {
    mediaItems(after: $after, search: $search, type: $type, state: $state) {
      hasNextPage
      hasPrevPage
      totalCount
      endCursor
      items {
        ... on MediaItem {
          id
          title
          type
          releaseDate
          year
          posterUrl: posterPath
          primaryExternalId
        }
      }
    }
  }
`;
