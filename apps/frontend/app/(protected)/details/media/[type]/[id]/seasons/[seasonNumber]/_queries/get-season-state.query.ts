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
  query GetSeasonState($tvdbId: String!) {
    itemRequestByExternalIds(tvdbId: $tvdbId) {
      id
      primaryMediaItem {
        ... on Show {
          id
          seasons(includeSpecials: true, includeUnrequestedSeasons: true) {
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
