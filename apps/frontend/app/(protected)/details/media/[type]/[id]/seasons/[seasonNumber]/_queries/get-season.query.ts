import { gql } from "@apollo/client";

import type {
  GetSeasonQuery,
  GetSeasonQueryVariables,
} from "./get-season.query.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_SEASON: TypedDocumentNode<
  GetSeasonQuery,
  GetSeasonQueryVariables
> = gql`
  query GetSeason($id: ID!, $seasonNumber: Int!) {
    tmdbItem(id: $id, type: show) {
      id
      type
      title
      backdropUrl
      logo(width: 750) {
        aspectRatio
        url
        height
        width
      }
      season(number: $seasonNumber) {
        id
        number
        title
        overview
        posterUrl
        episodes {
          id
          number
          seasonNumber
          title
          overview
          airDate
          runtime
          posterUrl
        }
      }
    }
  }
`;
