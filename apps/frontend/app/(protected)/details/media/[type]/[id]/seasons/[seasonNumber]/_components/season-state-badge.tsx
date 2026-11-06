import { LiveItemStateBadge } from "#components/item-state-badge/item-state-badge.client.tsx";
import { StatusBadge } from "#components/media/status-badge/status-badge.tsx";

import { fetchSeasonState } from "../_data-access/fetch-season-state.ts";

import type { StatusBadgeProps } from "#components/media/status-badge/status-badge.tsx";

interface SeasonStateBadgeProps extends Pick<
  StatusBadgeProps,
  "className" | "large"
> {
  showId: string;
  seasonNumber: number;
}

/**
 * Status badge for a season, which updates live once the season has been indexed.
 */
export async function SeasonStateBadge({
  showId,
  seasonNumber,
  ...props
}: SeasonStateBadgeProps) {
  const season = await fetchSeasonState(showId, seasonNumber);

  if (!season) {
    return <StatusBadge {...props} isRequested={false} />;
  }

  return (
    <LiveItemStateBadge
      {...props}
      id={season.id}
      isRequested={season.isRequested}
      initialState={season.state}
    />
  );
}
