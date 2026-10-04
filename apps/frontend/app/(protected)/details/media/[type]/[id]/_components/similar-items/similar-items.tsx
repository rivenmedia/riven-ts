import { fly } from "@/components/_animations/fly";
import { ErrorFallback } from "@/components/error-fallback/error-fallback";
import { ListCarouselSkeleton } from "@/components/list-carousel/list-carousel-skeleton";
import { SectionHeading } from "@/components/media/section-heading/section-heading";
import { query } from "@/lib/graphql/client";

import { cn } from "cn";
import { cacheLife, io } from "next/cache";
import { Suspense } from "react";

import { MediaCarousel } from "../media-carousel";
import { GET_SIMILAR_ITEMS } from "./_queries/get-similar-items.query";

interface SimilarItemsContentProps {
  id: string;
}

async function SimilarItemsContent({ id }: SimilarItemsContentProps) {
  "use cache";

  cacheLife("days");

  const { data } = await query({
    query: GET_SIMILAR_ITEMS,
    variables: {
      id,
    },
  });

  return <MediaCarousel items={data?.tmdbItem.similarItems ?? []} />;
}

interface SimilarItemsLoaderProps {
  id: string;
}

async function SimilarItemsLoader({ id }: SimilarItemsLoaderProps) {
  await io();

  return <SimilarItemsContent id={id} />;
}

interface SimilarItemsProps {
  id: string;
}

export function SimilarItems({ id }: SimilarItemsProps) {
  return (
    <section
      className={cn("mt-8 md:mt-12 animation-duration-400 delay-650", fly)}
    >
      <SectionHeading title="Similar Items" />
      <ErrorFallback message="Unable to load similar items">
        <Suspense fallback={<ListCarouselSkeleton />}>
          <SimilarItemsLoader id={id} />
        </Suspense>
      </ErrorFallback>
    </section>
  );
}
