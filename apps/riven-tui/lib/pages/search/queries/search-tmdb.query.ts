import { gql } from "@apollo/client";

import type {
  RivenTuiSearchTmdbQuery,
  RivenTuiSearchTmdbQueryVariables,
} from "./search-tmdb.query.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const SEARCH_TMDB: TypedDocumentNode<
  RivenTuiSearchTmdbQuery,
  RivenTuiSearchTmdbQueryVariables
> = gql`
  query RivenTuiSearchTmdb($query: String!) {
    tmdbSearch(query: $query) {
      id
      mediaType
      title
      overview
      releaseDate
      posterPath
      originalLanguage
      voteAverage
    }
  }
`;
