import { cn } from "cn";
import { cacheLife, io } from "next/cache";
import { Suspense } from "react";

import { fly } from "#components/_animations/fly.ts";
import { ErrorFallback } from "#components/error-fallback/error-fallback.tsx";
import { ListCarouselSkeleton } from "#components/list-carousel/list-carousel-skeleton.tsx";
import { SectionHeading } from "#components/media/section-heading/section-heading.tsx";
import { query } from "#lib/graphql/client.ts";

import { MediaCarousel } from "../media-carousel";
import { GET_SIMILAR_ITEMS } from "./_queries/get-similar-items.query";

import type { TopLevelMediaItemType } from "#app/_types/__generated__/graphql.ts";

interface SimilarItemsContentProps {
  id: string;
  type: TopLevelMediaItemType;
}

async function SimilarItemsContent({ id, type }: SimilarItemsContentProps) {
  "use cache";

  cacheLife("days");

  const { data } = await query({
    query: GET_SIMILAR_ITEMS,
    variables: {
      id,
      type,
    },
  });

  return <MediaCarousel items={data?.tmdbItem.similarItems ?? []} />;
}

interface SimilarItemsLoaderProps {
  id: string;
  type: TopLevelMediaItemType;
}

async function SimilarItemsLoader({ id, type }: SimilarItemsLoaderProps) {
  await io();

  return <SimilarItemsContent id={id} type={type} />;
}

interface SimilarItemsProps {
  id: string;
  type: TopLevelMediaItemType;
}

export function SimilarItems({ id, type }: SimilarItemsProps) {
  return (
    <section
      className={cn("mt-8 md:mt-12 animation-duration-400 delay-650", fly)}
    >
      <SectionHeading title="Similar Items" />
      <ErrorFallback message="Unable to load similar items">
        <Suspense fallback={<ListCarouselSkeleton />}>
          <SimilarItemsLoader id={id} type={type} />
        </Suspense>
      </ErrorFallback>
    </section>
  );
}
