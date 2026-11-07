import { gql } from "@apollo/client";

import type {
  OnMediaItemStateChangedSubscription,
  OnMediaItemStateChangedSubscriptionVariables,
} from "./on-media-item-state-changed.subscription.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const ON_MEDIA_ITEM_STATE_CHANGED: TypedDocumentNode<
  OnMediaItemStateChangedSubscription,
  OnMediaItemStateChangedSubscriptionVariables
> = gql`
  subscription OnMediaItemStateChanged($id: ID!) {
    mediaItemStateChanged(id: $id) {
      ... on MediaItem {
        state
      }
    }
  }
`;
