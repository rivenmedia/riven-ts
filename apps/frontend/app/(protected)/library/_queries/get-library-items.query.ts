import { type TypedDocumentNode, gql } from "@apollo/client";

import type {
  GetLibraryItemsQuery,
  GetLibraryItemsQueryVariables,
} from "../page.client.typegen";

export const GET_LIBRARY_ITEMS_QUERY: TypedDocumentNode<
  GetLibraryItemsQuery,
  GetLibraryItemsQueryVariables
> = gql`
  query GetLibraryItems {
    mediaItems {
      id
      title
      posterPath
    }
  }
`;
