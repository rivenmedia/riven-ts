import { fly } from "@/components/_animations/fly";
import { ErrorFallback } from "@/components/error-fallback/error-fallback";
import { ListCarouselSkeleton } from "@/components/list-carousel/list-carousel-skeleton";
import { SectionHeading } from "@/components/media/section-heading/section-heading";
import { query } from "@/lib/graphql/client";

import { cn } from "cn";
import { cacheLife, io } from "next/cache";
import { Suspense } from "react";

import { MediaCarousel } from "../media-carousel";
import { GET_ITEM_RECOMMENDATIONS } from "./_queries/get-item-recommendations.query";

interface ItemRecommendationsContentProps {
  id: string;
}

async function ItemRecommendationsContent({
  id,
}: ItemRecommendationsContentProps) {
  "use cache";

  cacheLife("days");

  const { data } = await query({
    query: GET_ITEM_RECOMMENDATIONS,
    variables: {
      id,
    },
  });

  return <MediaCarousel items={data?.tmdbItem.recommendations ?? []} />;
}

interface ItemRecommendationsLoaderProps {
  id: string;
}

async function ItemRecommendationsLoader({
  id,
}: ItemRecommendationsLoaderProps) {
  await io();

  return <ItemRecommendationsContent id={id} />;
}

interface ItemRecommendationsProps {
  id: string;
}

export function ItemRecommendations({ id }: ItemRecommendationsProps) {
  return (
    <section
      className={cn("mt-8 md:mt-12 animation-duration-400 delay-600", fly)}
    >
      <SectionHeading title="Recommendations" />
      <ErrorFallback message="Unable to load recommendations">
        <Suspense fallback={<ListCarouselSkeleton />}>
          <ItemRecommendationsLoader id={id} />
        </Suspense>
      </ErrorFallback>
    </section>
  );
}
