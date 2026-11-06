import { ShowChildLayout } from "../../_components/show-child-layout.tsx";
import { EpisodeCast } from "./_components/episode-cast.tsx";
import { EpisodeNavigation } from "./_components/episode-navigation.tsx";
import { EpisodeOverview } from "./_components/episode-overview.tsx";

import type { GetSeasonQuery } from "../../_queries/get-season.query.typegen.ts";

type Episode = NonNullable<
  GetSeasonQuery["tmdbItem"]["season"]
>["episodes"][number];

interface EpisodeDetailsPageProps {
  show: Omit<GetSeasonQuery["tmdbItem"], "season">;
  episode: Episode;
  previousEpisode: Episode | null;
  nextEpisode: Episode | null;
}

/**
 * Episode details route with the episode's state and cast, and links to the
 * season's previous and next episodes.
 */
export function EpisodeDetailsPage({
  show,
  episode,
  previousEpisode,
  nextEpisode,
}: EpisodeDetailsPageProps) {
  return (
    <ShowChildLayout show={show}>
      <EpisodeOverview show={show} episode={episode} />
      <EpisodeCast
        showId={show.id}
        seasonNumber={episode.seasonNumber}
        episodeNumber={episode.number}
      />
      <EpisodeNavigation
        showId={show.id}
        previousEpisode={previousEpisode}
        nextEpisode={nextEpisode}
      />
    </ShowChildLayout>
  );
}
