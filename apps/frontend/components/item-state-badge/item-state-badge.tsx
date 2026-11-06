import { io } from "next/cache";

import { query } from "#lib/graphql/client.ts";

import { GET_ITEM_STATE } from "./_queries/get-item-state.query.ts";
import { LiveItemStateBadge } from "./item-state-badge.client.tsx";

import type { StatusBadgeProps } from "#components/media/status-badge/status-badge.tsx";

interface ItemStateBadgeProps extends Pick<
  StatusBadgeProps,
  "className" | "large"
> {
  /**
   * The Riven ID of the media item (**not** its external TMDB/TVDB ID).
   */
  id: string;
}

/**
 * Status badge for a media item, which updates live as the item's state changes.
 */
export async function ItemStateBadge({ id, ...props }: ItemStateBadgeProps) {
  await io();

  const { data, error } = await query({
    query: GET_ITEM_STATE,
    variables: { id },
  });

  if (error) {
    throw error;
  }

  if (!data?.mediaItemById) {
    return null;
  }

  return (
    <LiveItemStateBadge
      {...props}
      id={id}
      isRequested={data.mediaItemById.isRequested}
      initialState={data.mediaItemById.state}
    />
  );
}
