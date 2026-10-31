"use client";

import { useSubscription } from "@apollo/client/react";

import { ON_MEDIA_ITEM_IS_PROCESSING } from "./_subscriptions/on-media-item-processing-state-change.subscription.ts";

interface ProcessingLabelProps {
  /**
   * The Riven ID of the media item (**not** its external ID).
   */
  id: string;
}

/**
 * Label shown while a media item is being processed, which follows the item's
 * processing state over a GraphQL subscription.
 */
export function ProcessingLabel({ id }: ProcessingLabelProps) {
  const { data } = useSubscription(ON_MEDIA_ITEM_IS_PROCESSING, {
    variables: { id },
  });

  if (!data?.mediaItemIsProcessing) {
    return null;
  }

  return (
    <output aria-label="Processing" className="text-muted-foreground text-xs">
      Processing...
    </output>
  );
}
