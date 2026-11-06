import { LiveItemStateBadge } from "#components/item-state-badge/item-state-badge.client.tsx";
import { StatusBadge } from "#components/media/status-badge/status-badge.tsx";

import { fetchSeasonState } from "../../../_data-access/fetch-season-state";

import type { StatusBadgeProps } from "#components/media/status-badge/status-badge.tsx";

interface EpisodeStateBadgeProps extends Pick<
  StatusBadgeProps,
  "className" | "large"
> {
  showId: string;
  seasonNumber: number;
  episodeNumber: number;
}

/**
 * Status badge for an episode, which updates live once the episode has been indexed.
 */
export async function EpisodeStateBadge({
  showId,
  seasonNumber,
  episodeNumber,
  ...props
}: EpisodeStateBadgeProps) {
  const season = await fetchSeasonState(showId, seasonNumber);
  const episode = season?.episodes.find(
    ({ number }) => number === episodeNumber,
  );

  if (!episode) {
    return <StatusBadge {...props} isRequested={false} />;
  }

  return (
    <LiveItemStateBadge
      {...props}
      id={episode.id}
      isRequested={episode.isRequested}
      initialState={episode.state}
    />
  );
}
