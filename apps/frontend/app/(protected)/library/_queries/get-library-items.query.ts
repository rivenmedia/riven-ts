import { gql } from "@apollo/client";

import type {
  GetLibraryItemsQuery,
  GetLibraryItemsQueryVariables,
} from "./get-library-items.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_LIBRARY_ITEMS_QUERY: TypedDocumentNode<
  GetLibraryItemsQuery,
  GetLibraryItemsQueryVariables
> = gql`
  query GetLibraryItems {
    mediaItems {
      items {
        ... on MediaItem {
          id
          title
          posterPath
          type
        }
      }
    }
  }
`;
