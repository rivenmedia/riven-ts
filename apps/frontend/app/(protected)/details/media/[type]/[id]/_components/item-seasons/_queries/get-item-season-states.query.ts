import { gql } from "@apollo/client";

import type {
  GetItemSeasonStatesQuery,
  GetItemSeasonStatesQueryVariables,
} from "./get-item-season-states.query.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_ITEM_SEASON_STATES: TypedDocumentNode<
  GetItemSeasonStatesQuery,
  GetItemSeasonStatesQueryVariables
> = gql`
  query GetItemSeasonStates($tvdbId: String!) {
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
            completedEpisodeCount
          }
        }
      }
    }
  }
`;
