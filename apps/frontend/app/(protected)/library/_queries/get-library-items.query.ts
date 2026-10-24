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
    $search: String
    $type: [MediaItemType!]
    $state: [MediaItemState!]
  ) {
    mediaItems(search: $search, type: $type, state: $state) {
      hasNextPage
      hasPrevPage
      totalCount
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
