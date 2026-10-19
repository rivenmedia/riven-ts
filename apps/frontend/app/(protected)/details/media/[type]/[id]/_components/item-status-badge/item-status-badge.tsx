import { io } from "next/cache";

import { StatusBadge } from "#components/media/status-badge/status-badge.tsx";
import { query } from "#lib/graphql/client.ts";

import { GET_ITEM_STATUS } from "./_queries/get-item-status.query";

import type { MediaItemType } from "#app/_types/__generated__/graphql.ts";

type ItemStatusBadgeProps = {
  indexerItemId: string;
} & (
  | {
      type: Extract<MediaItemType, "movie" | "show">;
      seasonNumber?: never;
      episodeNumber?: never;
    }
  | {
      type: Extract<MediaItemType, "season">;
      seasonNumber: number;
      episodeNumber?: never;
    }
  | {
      type: Extract<MediaItemType, "episode">;
      seasonNumber: number;
      episodeNumber: number;
    }
);

export async function ItemStatusBadge({
  indexerItemId,
  seasonNumber,
  episodeNumber,
  type,
}: ItemStatusBadgeProps) {
  await io();

  const { data } = await query({
    query: GET_ITEM_STATUS,
    variables: {
      type,
      ...(type === "movie"
        ? { tmdbId: indexerItemId }
        : { tvdbId: indexerItemId }),
      ...(type === "season" ? { seasonNumber } : {}),
      ...(type === "episode" ? { seasonNumber, episodeNumber } : {}),
    },
    errorPolicy: "all",
  });

  if (!data?.itemRequestByExternalIds?.mediaItem) {
    return null;
  }

  return (
    <StatusBadge
      className="px-3 py-1.5 text-sm font-medium inline-block h-8"
      state={data.itemRequestByExternalIds.mediaItem.state}
      isRequested={data.itemRequestByExternalIds.mediaItem.isRequested}
      large
    />
  );
}
