import { gql } from "@apollo/client";

import type {
  GetEpisodeCastQuery,
  GetEpisodeCastQueryVariables,
} from "./get-episode-cast.query.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_EPISODE_CAST: TypedDocumentNode<
  GetEpisodeCastQuery,
  GetEpisodeCastQueryVariables
> = gql`
  query GetEpisodeCast(
    $id: ID!
    $seasonNumber: Int!
    $episodeNumber: Int!
    $language: String!
  ) {
    tmdbItem(id: $id, type: show) {
      id
      type
      season(number: $seasonNumber) {
        id
        episode(number: $episodeNumber) {
          id
          cast(language: $language) {
            id
            name
            character
            profileUrl
          }
        }
      }
    }
  }
`;
