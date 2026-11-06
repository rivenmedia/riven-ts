import { SeasonEpisodes } from "./_components/season-episodes.tsx";
import { SeasonOverview } from "./_components/season-overview.tsx";
import { ShowChildLayout } from "./_components/show-child-layout.tsx";

import type { GetSeasonQuery } from "./_queries/get-season.query.typegen.ts";

interface SeasonDetailsPageProps {
  show: Omit<GetSeasonQuery["tmdbItem"], "season">;
  season: NonNullable<GetSeasonQuery["tmdbItem"]["season"]>;
}

/**
 * Season details route with the season's state and its episodes.
 */
export function SeasonDetailsPage({ show, season }: SeasonDetailsPageProps) {
  return (
    <ShowChildLayout show={show}>
      <SeasonOverview show={show} season={season} />
      <SeasonEpisodes
        showId={show.id}
        seasonNumber={season.number}
        episodes={season.episodes}
      />
    </ShowChildLayout>
  );
}
