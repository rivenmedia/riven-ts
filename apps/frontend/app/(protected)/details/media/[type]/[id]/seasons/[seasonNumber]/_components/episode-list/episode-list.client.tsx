"use client";

import { useSubscription } from "@apollo/client/react";

import { LiveContentProvider } from "#components/providers/live-content-provider.tsx";

import { ON_SEASON_EPISODES_UPDATED } from "../../_subscriptions/on-season-episodes-updated.subscription.ts";
import { EpisodeList } from "./episode-list.tsx";

import type { EpisodeListProps } from "./episode-list.tsx";

interface LiveEpisodeListProps extends EpisodeListProps {
  /**
   * The Riven ID of the season's media item (**not** its external TVDB ID).
   */
  seasonId: string;
}

/**
 * Episode list that starts from the server-rendered episode states, then
 * follows them over the season's GraphQL subscription.
 */
export function LiveEpisodeList({
  seasonId,
  episodeStates,
  ...props
}: LiveEpisodeListProps) {
  const { data } = useSubscription(ON_SEASON_EPISODES_UPDATED, {
    variables: { id: seasonId },
  });

  return (
    <LiveContentProvider>
      <EpisodeList
        {...props}
        episodeStates={
          data
            ? new Map(
                data.seasonUpdated.episodes.map((episode) => [
                  episode.number,
                  episode,
                ]),
              )
            : episodeStates
        }
      />
    </LiveContentProvider>
  );
}
