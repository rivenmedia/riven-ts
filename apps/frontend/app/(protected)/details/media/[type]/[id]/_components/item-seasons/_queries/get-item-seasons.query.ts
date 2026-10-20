import { gql } from "@apollo/client";

import type {
  GetItemSeasonsQuery,
  GetItemSeasonsQueryVariables,
} from "./get-item-seasons.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_ITEM_SEASONS: TypedDocumentNode<
  GetItemSeasonsQuery,
  GetItemSeasonsQueryVariables
> = gql`
  query GetItemSeasons($id: ID!) {
    tmdbItem(id: $id, type: show) {
      id
      type
      seasons {
        id
        title
        episodes {
          id
          number
          posterUrl
          title
        }
        posterUrl
        number
        mediaItem {
          isRequested
          state
          completedEpisodeCount
        }
      }
    }
  }
`;
