import { gql } from "@apollo/client";

import type {
  OnMediaItemIsProcessingSubscription,
  OnMediaItemIsProcessingSubscriptionVariables,
} from "./on-media-item-processing-state-change.subscription.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const ON_MEDIA_ITEM_IS_PROCESSING: TypedDocumentNode<
  OnMediaItemIsProcessingSubscription,
  OnMediaItemIsProcessingSubscriptionVariables
> = gql`
  subscription OnMediaItemIsProcessing($id: ID!) {
    mediaItemIsProcessing(id: $id)
  }
`;
