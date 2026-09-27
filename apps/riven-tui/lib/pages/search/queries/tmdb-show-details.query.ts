import { gql } from "@apollo/client";

import type {
  RivenTuiTmdbShowDetailsQuery,
  RivenTuiTmdbShowDetailsQueryVariables,
} from "./tmdb-show-details.query.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const TMDB_SHOW_DETAILS: TypedDocumentNode<
  RivenTuiTmdbShowDetailsQuery,
  RivenTuiTmdbShowDetailsQueryVariables
> = gql`
  query RivenTuiTmdbShowDetails($id: Int!) {
    tmdbShowDetails(id: $id) {
      id
      name
      numberOfSeasons
      tvdbId
    }
  }
`;
