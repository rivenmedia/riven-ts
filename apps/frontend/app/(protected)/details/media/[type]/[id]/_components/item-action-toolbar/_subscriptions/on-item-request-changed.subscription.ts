import { gql } from "@apollo/client";

import type {
  OnItemRequestChangedSubscription,
  OnItemRequestChangedSubscriptionVariables,
} from "./on-item-request-changed.subscription.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const ON_ITEM_REQUEST_CHANGED: TypedDocumentNode<
  OnItemRequestChangedSubscription,
  OnItemRequestChangedSubscriptionVariables
> = gql`
  subscription OnItemRequestChanged($tmdbId: String, $tvdbId: String) {
    itemRequestChanged(tmdbId: $tmdbId, tvdbId: $tvdbId)
  }
`;
