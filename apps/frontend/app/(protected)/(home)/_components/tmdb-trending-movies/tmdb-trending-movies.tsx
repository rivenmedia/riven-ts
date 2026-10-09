import { cacheLife, io } from "next/cache";
import { Suspense } from "react";

import { TrendingTimeWindowSection } from "#app/(protected)/(home)/_components/trending-time-window-section.tsx";
import { ErrorFallback } from "#components/error-fallback/error-fallback.tsx";
import { ListCarouselSkeleton } from "#components/list-carousel/list-carousel-skeleton.tsx";
import { ListCarousel } from "#components/list-carousel/list-carousel.tsx";
import { query } from "#lib/graphql/client.ts";

import { GET_TMDB_TRENDING_MOVIES } from "./_queries/get-tmdb-trending-movies.ts";

import type { TmdbTrendingMoviesTimeWindow } from "#app/_types/__generated__/graphql.ts";

interface TMDBTrendingMoviesContentProps {
  timeWindow: TmdbTrendingMoviesTimeWindow;
}

/**
 * RSC which caches the TMDB Trending Movies carousel for a given time window.
 */
async function TMDBTrendingMoviesContent({
  timeWindow,
}: TMDBTrendingMoviesContentProps) {
  "use cache";

  cacheLife("hours");

  const { data } = await query({
    query: GET_TMDB_TRENDING_MOVIES,
    variables: { timeWindow },
  });

  if (!data?.tmdbTrendingMovies) {
    throw new Error("Failed to load trending movies");
  }

  return (
    <ListCarousel
      key={timeWindow}
      items={data.tmdbTrendingMovies}
      indexer="tmdb"
      ignoreAnimation
    />
  );
}

interface TMDBTrendingMoviesLoaderProps {
  timeWindow: TmdbTrendingMoviesTimeWindow;
}

/**
 * RSC which caches the TMDB Trending Movies carousel for a given time window.
 */
async function TMDBTrendingMoviesLoader({
  timeWindow,
}: TMDBTrendingMoviesLoaderProps) {
  await io();

  return <TMDBTrendingMoviesContent timeWindow={timeWindow} />;
}

interface TMDBTrendingMoviesSlotProps {
  timeWindow: TmdbTrendingMoviesTimeWindow;
}

function TMDBTrendingMoviesSlot({ timeWindow }: TMDBTrendingMoviesSlotProps) {
  return (
    <ErrorFallback message="Unable to load trending movies.">
      <Suspense fallback={<ListCarouselSkeleton />}>
        <TMDBTrendingMoviesLoader timeWindow={timeWindow} />
      </Suspense>
    </ErrorFallback>
  );
}

export function TMDBTrendingMovies() {
  return (
    <TrendingTimeWindowSection
      title="Trending Movies"
      viewAllHref="/lists/trending/movies"
      slots={{
        day: <TMDBTrendingMoviesSlot timeWindow="day" />,
        week: <TMDBTrendingMoviesSlot timeWindow="week" />,
      }}
    />
  );
}
