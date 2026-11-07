import { gql } from "@apollo/client";

import type {
  GetSearchResultsQuery,
  GetSearchResultsQueryVariables,
} from "./get-search-results.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_SEARCH_RESULTS: TypedDocumentNode<
  GetSearchResultsQuery,
  GetSearchResultsQueryVariables
> = gql`
  query GetSearchResults($query: String!, $page: Int!) {
    search(query: $query, page: $page) {
      errors {
        message
        plugin
      }
      results {
        item {
          id
          title
          posterUrl
          type
          year
          isRequestable
        }
        plugin
      }
    }
  }
`;
