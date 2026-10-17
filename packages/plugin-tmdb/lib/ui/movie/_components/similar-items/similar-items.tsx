import { fly } from "@repo/util-ui/components/_animations/fly.ts";
import { ErrorFallback } from "@repo/util-ui/components/error-fallback/error-fallback.tsx";
import { ListCarouselSkeleton } from "@repo/util-ui/components/list-carousel/list-carousel-skeleton.tsx";
import { SectionHeading } from "@repo/util-ui/components/media/section-heading/section-heading.tsx";
import { query } from "@repo/util-ui/graphql/client.ts";

import { cn } from "cn";
import { cacheLife, io } from "next/cache";
import { Suspense } from "react";

import { MediaCarousel } from "../media-carousel.tsx";
import { GET_SIMILAR_ITEMS } from "./_queries/get-similar-items.query.ts";

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
