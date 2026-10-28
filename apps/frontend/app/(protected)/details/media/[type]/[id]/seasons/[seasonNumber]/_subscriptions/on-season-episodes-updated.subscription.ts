import { gql } from "@apollo/client";

import type {
  OnSeasonEpisodesUpdatedSubscription,
  OnSeasonEpisodesUpdatedSubscriptionVariables,
} from "./on-season-episodes-updated.subscription.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const ON_SEASON_EPISODES_UPDATED: TypedDocumentNode<
  OnSeasonEpisodesUpdatedSubscription,
  OnSeasonEpisodesUpdatedSubscriptionVariables
> = gql`
  subscription OnSeasonEpisodesUpdated($id: ID!) {
    seasonUpdated(id: $id) {
      id
      episodes {
        id
        number
        isRequested
        state
      }
    }
  }
`;
