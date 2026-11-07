import { gql } from "@apollo/client";

import type {
  GetSeasonStateQuery,
  GetSeasonStateQueryVariables,
} from "./get-season-state.query.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_SEASON_STATE: TypedDocumentNode<
  GetSeasonStateQuery,
  GetSeasonStateQueryVariables
> = gql`
  query GetSeasonState($tvdbId: String!, $number: Int!) {
    itemRequestByExternalIds(tvdbId: $tvdbId) {
      id
      primaryMediaItem {
        ... on Show {
          id
          season(number: $number) {
            id
            number
            isRequested
            state
            episodes {
              id
              number
              isRequested
              state
            }
          }
        }
      }
    }
  }
`;
