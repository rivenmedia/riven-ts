import { io } from "next/cache";

import { StatusBadge } from "#components/media/status-badge/status-badge.tsx";
import { query } from "#lib/graphql/client.ts";

import { GET_ITEM_STATUS } from "./_queries/get-item-status.query";

interface ItemStatusBadgeProps {
  id: string;
}

export async function ItemStatusBadge({ id }: ItemStatusBadgeProps) {
  await io();

  const { data } = await query({
    query: GET_ITEM_STATUS,
    variables: { tmdbId: id },
    errorPolicy: "all",
  });

  if (!data?.itemRequestByExternalIds?.primaryMediaItem) {
    return null;
  }

  return (
    <StatusBadge
      className="px-3 py-1.5 text-sm font-medium inline-block h-8"
      state={data.itemRequestByExternalIds.primaryMediaItem.state}
      large
    />
  );
}
