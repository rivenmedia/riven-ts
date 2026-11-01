import { cn } from "cn";
import { Suspense } from "react";

import { fly } from "#components/_animations/fly.ts";
import { Skeleton } from "#components/_ui/skeleton.tsx";
import { ErrorFallback } from "#components/error-fallback/error-fallback.tsx";
import { SectionHeading } from "#components/media/section-heading/section-heading.tsx";

import { fetchSeasonState } from "../_data-access/fetch-season-state.ts";
import { LiveEpisodeList } from "./episode-list/episode-list.client.tsx";
import { EpisodeList } from "./episode-list/episode-list.tsx";

import type { EpisodeListProps } from "./episode-list/episode-list.tsx";

type SeasonEpisodesProps = Omit<EpisodeListProps, "episodeStates">;

function EpisodeListSkeleton({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: Math.min(count, 6) }, (_, i) => i).map((i) => (
        <div key={i} className="flex gap-4 p-2 md:gap-6">
          <Skeleton className="aspect-video w-32 shrink-0 rounded-lg sm:w-44 md:w-56" />
          <div className="flex w-full flex-col gap-2 py-1">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function SeasonEpisodesLoader(props: SeasonEpisodesProps) {
  // The episodes are cached, so the indexed episodes' states are fetched separately to stay up to date
  const season = await fetchSeasonState(props.showId, props.seasonNumber);

  if (!season) {
    return <EpisodeList {...props} episodeStates={new Map()} />;
  }

  return (
    <LiveEpisodeList
      {...props}
      seasonId={season.id}
      episodeStates={
        new Map(season.episodes.map((episode) => [episode.number, episode]))
      }
    />
  );
}

export function SeasonEpisodes(props: SeasonEpisodesProps) {
  return (
    <section
      className={cn("mt-8 md:mt-12 animation-duration-400 delay-300", fly)}
    >
      <SectionHeading title="Episodes" />
      <ErrorFallback message="Unable to load episodes">
        <Suspense
          fallback={<EpisodeListSkeleton count={props.episodes.length} />}
        >
          <SeasonEpisodesLoader {...props} />
        </Suspense>
      </ErrorFallback>
    </section>
  );
}
