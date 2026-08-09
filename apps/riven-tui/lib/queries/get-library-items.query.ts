import { gql } from "@apollo/client";

import type {
  GetLibraryItemsQuery,
  GetLibraryItemsQueryVariables,
} from "./get-library-items.query.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_LIBRARY_ITEMS: TypedDocumentNode<
  GetLibraryItemsQuery,
  GetLibraryItemsQueryVariables
> = gql`
  query GetLibraryItems {
    mediaItems {
      ... on MediaItem {
        __typename
        id
        fullTitle
        state
      }
    }
  }
`;
