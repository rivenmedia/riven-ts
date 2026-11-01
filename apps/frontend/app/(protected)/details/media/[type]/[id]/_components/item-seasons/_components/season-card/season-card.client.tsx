"use client";

import { useSubscription } from "@apollo/client/react";

import { LiveContentProvider } from "#components/providers/live-content-provider.tsx";

import { ON_SEASON_UPDATED } from "../../_subscriptions/on-season-updated.subscription.ts";
import { SeasonCard } from "./season-card.tsx";

import type { SeasonCardProps, SeasonState } from "./season-card.tsx";

interface LiveSeasonCardProps extends Omit<SeasonCardProps, "season"> {
  /**
   * The Riven ID of the season's media item (**not** its external TMDB/TVDB ID).
   */
  id: string;
  initialSeason: SeasonState;
}

/**
 * Season card that starts from the server-rendered season, then follows the
 * season's state and completed episode count over a GraphQL subscription.
 */
export function LiveSeasonCard({
  id,
  initialSeason,
  ...props
}: LiveSeasonCardProps) {
  const { data } = useSubscription(ON_SEASON_UPDATED, {
    variables: { id },
  });

  return (
    <LiveContentProvider>
      <SeasonCard
        {...props}
        season={{
          isRequested: initialSeason.isRequested,
          state: data?.seasonUpdated.state ?? initialSeason.state,
          completedEpisodeCount:
            data?.seasonUpdated.completedEpisodeCount ??
            initialSeason.completedEpisodeCount,
        }}
      />
    </LiveContentProvider>
  );
}
