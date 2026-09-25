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
  GetTrendingMoviesQuery,
  GetTrendingMoviesQueryVariables,
} from "./trending-movies.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_TRENDING_MOVIES: TypedDocumentNode<
  GetTrendingMoviesQuery,
  GetTrendingMoviesQueryVariables
> = gql`
  query GetTrendingMovies($timeWindow: String = "day") {
    trendingMovies(timeWindow: $timeWindow) {
      id
      title
      posterPath
      type
      year
    }
  }
`;

function TrendingMoviesInner({ timeWindow }: { timeWindow: string }) {
  const { data } = useSuspenseQuery(GET_TRENDING_MOVIES, {
    variables: { timeWindow },
  });

  return (
    <ListCarousel items={data.trendingMovies} indexer="tmdb" ignoreAnimation />
  );
}

export function TrendingMovies() {
  const [timeWindow, setTimeWindow] = useState("day");

  return (
    <>
      <div className="mb-1 flex items-center justify-between">
        <SectionHeading title="Trending Movies" />
        <TrendingItemsActions
          aria-label="Trending movies actions"
          setTimeWindow={setTimeWindow}
          viewAllHref="/lists/trending/movies"
        />
      </div>
      <ErrorBoundary FallbackComponent={ListCarouselSuspenseError}>
        <Suspense fallback={<ListCarouselSkeleton />}>
          <TrendingMoviesInner timeWindow={timeWindow} />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
