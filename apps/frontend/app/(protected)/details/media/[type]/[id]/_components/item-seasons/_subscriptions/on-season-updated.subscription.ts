import { gql } from "@apollo/client";

import type {
  OnSeasonUpdatedSubscription,
  OnSeasonUpdatedSubscriptionVariables,
} from "./on-season-updated.subscription.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const ON_SEASON_UPDATED: TypedDocumentNode<
  OnSeasonUpdatedSubscription,
  OnSeasonUpdatedSubscriptionVariables
> = gql`
  subscription OnSeasonUpdated($id: ID!) {
    seasonUpdated(id: $id) {
      state
      completedEpisodeCount
    }
  }
`;
