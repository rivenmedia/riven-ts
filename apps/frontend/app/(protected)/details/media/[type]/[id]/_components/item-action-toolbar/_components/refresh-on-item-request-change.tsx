"use client";

import { useSubscription } from "@apollo/client/react";
import { useRouter } from "next/navigation";

import { ON_ITEM_REQUEST_CHANGED } from "../_subscriptions/on-item-request-changed.subscription.ts";

import type { OnItemRequestChangedSubscriptionVariables } from "../_subscriptions/on-item-request-changed.subscription.typegen.ts";

interface RefreshOnItemRequestChangeProps {
  externalIds: OnItemRequestChangedSubscriptionVariables;
}

/**
 * Refreshes the page whenever the item's request is created, indexed or removed,
 * so the server-rendered item actions and state badge reflect it.
 *
 * Requests are processed in the background, so the page can't simply refresh once the request action succeeds.
 */
export function RefreshOnItemRequestChange({
  externalIds,
}: RefreshOnItemRequestChangeProps) {
  const router = useRouter();

  useSubscription(ON_ITEM_REQUEST_CHANGED, {
    variables: externalIds,
    ignoreResults: true,
    onData() {
      router.refresh();
    },
  });

  // This is a null-returning component instead of a hook,
  // so that it may be used in Server Components.
  return null;
}
