import { cacheLife, io } from "next/cache";
import { Suspense } from "react";

import { TrendingTimeWindowSection } from "#app/(protected)/(home)/_components/trending-time-window-section.tsx";
import { ErrorFallback } from "#components/error-fallback/error-fallback.tsx";
import { ListCarouselSkeleton } from "#components/list-carousel/list-carousel-skeleton.tsx";
import { ListCarousel } from "#components/list-carousel/list-carousel.tsx";
import { query } from "#lib/graphql/client.ts";

import { GET_TMDB_TRENDING_SHOWS } from "./_queries/get-tmdb-trending-shows.ts";

import type { TmdbTrendingTimeWindow } from "#app/_types/__generated__/graphql.ts";

interface TMDBTrendingShowsContentProps {
  timeWindow: TmdbTrendingTimeWindow;
}

/**
 * RSC which caches the TMDB Trending Shows carousel for a given time window.
 */
async function TMDBTrendingShowsContent({
  timeWindow,
}: TMDBTrendingShowsContentProps) {
  "use cache";

  cacheLife("hours");

  const { data } = await query({
    query: GET_TMDB_TRENDING_SHOWS,
    variables: { timeWindow },
  });

  if (!data?.tmdbTrendingShows) {
    throw new Error("Failed to load trending shows");
  }

  return (
    <ListCarousel
      key={timeWindow}
      items={data.tmdbTrendingShows}
      ignoreAnimation
    />
  );
}

interface TMDBTrendingShowsLoaderProps {
  timeWindow: TmdbTrendingTimeWindow;
}

async function TMDBTrendingShowsLoader({
  timeWindow,
}: TMDBTrendingShowsLoaderProps) {
  await io();

  return <TMDBTrendingShowsContent timeWindow={timeWindow} />;
}

interface TMDBTrendingShowsSlotProps {
  timeWindow: TmdbTrendingTimeWindow;
}

function TMDBTrendingShowsSlot({ timeWindow }: TMDBTrendingShowsSlotProps) {
  return (
    <ErrorFallback message="Unable to load trending shows.">
      <Suspense fallback={<ListCarouselSkeleton />}>
        <TMDBTrendingShowsLoader timeWindow={timeWindow} />
      </Suspense>
    </ErrorFallback>
  );
}

export function TMDBTrendingShows() {
  return (
    <TrendingTimeWindowSection
      title="Trending TV Shows"
      viewAllHref="/lists/trending/shows"
      slots={{
        day: <TMDBTrendingShowsSlot timeWindow="day" />,
        week: <TMDBTrendingShowsSlot timeWindow="week" />,
      }}
    />
  );
}
