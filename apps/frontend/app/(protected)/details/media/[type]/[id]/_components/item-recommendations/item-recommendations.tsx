import { cn } from "cn";
import { cacheLife, io } from "next/cache";
import { Suspense } from "react";

import { fly } from "#components/_animations/fly.ts";
import { ErrorFallback } from "#components/error-fallback/error-fallback.tsx";
import { ListCarouselSkeleton } from "#components/list-carousel/list-carousel-skeleton.tsx";
import { SectionHeading } from "#components/media/section-heading/section-heading.tsx";
import { query } from "#lib/graphql/client.ts";

import { MediaCarousel } from "../media-carousel";
import { GET_ITEM_RECOMMENDATIONS } from "./_queries/get-item-recommendations.query";

import type { TopLevelMediaItemType } from "#app/_types/__generated__/graphql.ts";

interface ItemRecommendationsContentProps {
  id: string;
  type: TopLevelMediaItemType;
}

async function ItemRecommendationsContent({
  id,
  type,
}: ItemRecommendationsContentProps) {
  "use cache";

  cacheLife("days");

  const { data } = await query({
    query: GET_ITEM_RECOMMENDATIONS,
    variables: {
      id,
      type,
    },
  });

  return <MediaCarousel items={data?.tmdbItem.recommendations ?? []} />;
}

interface ItemRecommendationsLoaderProps {
  id: string;
  type: TopLevelMediaItemType;
}

async function ItemRecommendationsLoader({
  id,
  type,
}: ItemRecommendationsLoaderProps) {
  await io();

  return <ItemRecommendationsContent id={id} type={type} />;
}

interface ItemRecommendationsProps {
  id: string;
  type: TopLevelMediaItemType;
}

export function ItemRecommendations({ id, type }: ItemRecommendationsProps) {
  return (
    <section
      className={cn("mt-8 md:mt-12 animation-duration-400 delay-600", fly)}
    >
      <SectionHeading title="Recommendations" />
      <ErrorFallback message="Unable to load recommendations">
        <Suspense fallback={<ListCarouselSkeleton />}>
          <ItemRecommendationsLoader id={id} type={type} />
        </Suspense>
      </ErrorFallback>
    </section>
  );
}
