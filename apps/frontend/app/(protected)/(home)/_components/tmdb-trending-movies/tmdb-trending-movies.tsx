import { ErrorFallback } from "@/components/error-fallback/error-fallback";
import { ListCarousel } from "@/components/list-carousel/list-carousel";
import { ListCarouselSkeleton } from "@/components/list-carousel/list-carousel-skeleton";
import { query } from "@/lib/graphql/client";

import { cacheLife } from "next/cache";
import { Suspense } from "react";

import { TrendingTimeWindowSection } from "../trending-time-window-section";
import { GET_TMDB_TRENDING_MOVIES } from "./_queries/get-tmdb-trending-movies";

interface TMDBTrendingMoviesLoaderProps {
  timeWindow: "day" | "week";
}

/**
 * RSC which caches the TMDB Trending Movies carousel for a given time window.
 */
async function TMDBTrendingMoviesLoader({
  timeWindow,
}: TMDBTrendingMoviesLoaderProps) {
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
      items={data.tmdbTrendingMovies}
      indexer="tmdb"
      ignoreAnimation
    />
  );
}

function TMDBTrendingMoviesSlot({
  timeWindow,
}: {
  timeWindow: "day" | "week";
}) {
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
      aria-label="Trending movies actions"
      viewAllHref="/lists/trending/movies"
      slots={{
        day: <TMDBTrendingMoviesSlot timeWindow="day" />,
        week: <TMDBTrendingMoviesSlot timeWindow="week" />,
      }}
    />
  );
}
