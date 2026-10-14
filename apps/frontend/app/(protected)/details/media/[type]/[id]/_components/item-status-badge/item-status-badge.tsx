import { StatusBadge } from "#components/media/status-badge/status-badge.tsx";
import { query } from "#lib/graphql/client.ts";

import { GET_ITEM_STATUS } from "./_queries/get-item-status.query";

interface ItemStatusBadgeProps {
  id: string;
}

export async function ItemStatusBadge({ id }: ItemStatusBadgeProps) {
  const { data } = await query({
    query: GET_ITEM_STATUS,
    variables: { tmdbId: id },
    errorPolicy: "all",
  });

  const mediaItem = data?.itemRequestByExternalIds?.mediaItems.find(
    (item) => item.__typename === "Movie" || item.__typename === "Show",
  );

  if (!mediaItem) {
    return null;
  }

  return (
    <StatusBadge
      className="px-3 py-1.5 text-sm font-medium inline-block h-8"
      state={mediaItem.state}
      large
    />
  );
}
