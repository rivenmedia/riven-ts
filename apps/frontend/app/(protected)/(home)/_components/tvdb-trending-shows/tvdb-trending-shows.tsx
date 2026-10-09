import { cacheLife, io } from "next/cache";
import { Suspense } from "react";

import { TrendingTimeWindowSection } from "#app/(protected)/(home)/_components/trending-time-window-section.tsx";
import { ErrorFallback } from "#components/error-fallback/error-fallback.tsx";
import { ListCarouselSkeleton } from "#components/list-carousel/list-carousel-skeleton.tsx";
import { ListCarousel } from "#components/list-carousel/list-carousel.tsx";
import { query } from "#lib/graphql/client.ts";

import { GET_TVDB_TRENDING_SHOWS } from "./_queries/get-tvdb-trending-shows.ts";

interface TVDBTrendingShowsContentProps {
  timeWindow: "day" | "week";
}

/**
 * RSC which caches the TVDB Trending Shows carousel for a given time window.
 */
async function TVDBTrendingShowsContent({
  timeWindow,
}: TVDBTrendingShowsContentProps) {
  "use cache";

  cacheLife("hours");

  const { data } = await query({
    query: GET_TVDB_TRENDING_SHOWS,
    variables: { timeWindow },
  });

  if (!data?.tvdbTrendingShows) {
    throw new Error("Failed to load trending shows");
  }

  return (
    <ListCarousel
      items={data.tvdbTrendingShows}
      indexer="tvdb"
      ignoreAnimation
    />
  );
}

interface TVDBTrendingShowsLoaderProps {
  timeWindow: "day" | "week";
}

async function TVDBTrendingShowsLoader({
  timeWindow,
}: TVDBTrendingShowsLoaderProps) {
  await io();

  return <TVDBTrendingShowsContent timeWindow={timeWindow} />;
}

function TVDBTrendingShowsSlot({ timeWindow }: { timeWindow: "day" | "week" }) {
  return (
    <ErrorFallback message="Unable to load trending shows.">
      <Suspense fallback={<ListCarouselSkeleton />}>
        <TVDBTrendingShowsLoader timeWindow={timeWindow} />
      </Suspense>
    </ErrorFallback>
  );
}

export function TVDBTrendingShows() {
  return (
    <TrendingTimeWindowSection
      title="Trending TV Shows"
      viewAllHref="/lists/trending/shows"
      slots={{
        day: <TVDBTrendingShowsSlot timeWindow="day" />,
        week: <TVDBTrendingShowsSlot timeWindow="week" />,
      }}
    />
  );
}
