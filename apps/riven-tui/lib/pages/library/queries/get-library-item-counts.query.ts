import { gql } from "@apollo/client";

import type {
  RivenTuiGetLibraryItemCountsQuery,
  RivenTuiGetLibraryItemCountsQueryVariables,
} from "./get-library-item-counts.query.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_LIBRARY_ITEM_COUNTS: TypedDocumentNode<
  RivenTuiGetLibraryItemCountsQuery,
  RivenTuiGetLibraryItemCountsQueryVariables
> = gql`
  query RivenTuiGetLibraryItemCounts {
    totalShows: mediaItemsCount(type: [show])
    totalMovies: mediaItemsCount(type: [movie])
  }
`;
