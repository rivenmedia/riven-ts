import { ListCarousel } from "@/components/list-carousel/list-carousel";
import { ListCarouselSkeleton } from "@/components/list-carousel/list-carousel-skeleton";
import { ListCarouselSuspenseError } from "@/components/list-carousel/list-carousel-suspense-error";
import { SectionHeading } from "@/components/media/section-heading/section-heading";

import { gql } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { TrendingItemsActions } from "./trending-items-actions";

import type { TypedDocumentNode } from "@apollo/client";
import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

export const GET_TRENDING_MOVIES: TypedDocumentNode<
  {
    trendingMovies: Pick<
      MediaItem,
      "id" | "title" | "posterPath" | "type" | "year"
    >[];
  },
  {
    timeWindow?: string;
  }
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

  return <ListCarousel items={data.trendingMovies} indexer="tmdb" />;
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
          viewAllHref="/lists/trending/movie"
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
