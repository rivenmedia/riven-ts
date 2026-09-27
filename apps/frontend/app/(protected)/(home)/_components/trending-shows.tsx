import { ListCarousel } from "@/components/list-carousel/list-carousel";
import { ListCarouselSkeleton } from "@/components/list-carousel/list-carousel-skeleton";
import { ListCarouselSuspenseError } from "@/components/list-carousel/list-carousel-suspense-error";
import { SectionHeading } from "@/components/media/section-heading/section-heading";

import { gql } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { TrendingItemsActions } from "./trending-items-actions";

import type {
  GetTrendingShowsQuery,
  GetTrendingShowsQueryVariables,
} from "./trending-shows.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_TRENDING_SHOWS: TypedDocumentNode<
  GetTrendingShowsQuery,
  GetTrendingShowsQueryVariables
> = gql`
  query GetTrendingShows($timeWindow: String = "day") {
    trendingShows(timeWindow: $timeWindow) {
      id
      title
      posterPath
      type
      year
    }
  }
`;

function TrendingShowsInner({ timeWindow }: { timeWindow: string }) {
  const { data } = useSuspenseQuery(GET_TRENDING_SHOWS, {
    variables: { timeWindow },
  });

  return (
    <ListCarousel items={data.trendingShows} indexer="tmdb" ignoreAnimation />
  );
}

export function TrendingShows() {
  const [timeWindow, setTimeWindow] = useState("day");

  return (
    <>
      <div className="mb-1 flex items-center justify-between">
        <SectionHeading title="Trending TV Shows" />
        <TrendingItemsActions
          aria-label="Trending TV shows actions"
          setTimeWindow={setTimeWindow}
          viewAllHref="/lists/trending/shows"
        />
      </div>
      <ErrorBoundary FallbackComponent={ListCarouselSuspenseError}>
        <Suspense fallback={<ListCarouselSkeleton />}>
          <TrendingShowsInner timeWindow={timeWindow} />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
