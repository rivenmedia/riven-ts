"use client";

import { useSubscription } from "@apollo/client/react";

import { StatusBadge } from "#components/media/status-badge/status-badge.tsx";
import { LiveContentProvider } from "#components/providers/live-content-provider.tsx";

import { ON_MEDIA_ITEM_STATE_CHANGED } from "./_subscriptions/on-media-item-state-changed.subscription.ts";

import type { StatusBadgeProps } from "#components/media/status-badge/status-badge.tsx";
import type { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

interface LiveItemStateBadgeProps extends Pick<
  StatusBadgeProps,
  "className" | "large"
> {
  id: string;
  isRequested: boolean;
  initialState: MediaItemState;
}

/**
 * Status badge that starts from the server-rendered state, then follows the
 * item's state changes over a GraphQL subscription.
 */
export function LiveItemStateBadge({
  id,
  isRequested,
  initialState,
  ...props
}: LiveItemStateBadgeProps) {
  const { data } = useSubscription(ON_MEDIA_ITEM_STATE_CHANGED, {
    variables: { id },
  });

  return (
    <LiveContentProvider>
      <StatusBadge
        {...props}
        state={data?.mediaItemStateChanged.state ?? initialState}
        isRequested={isRequested}
      />
    </LiveContentProvider>
  );
}
