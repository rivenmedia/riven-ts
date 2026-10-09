import { fly } from "@/components/_animations/fly";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/_ui/carousel";
import { ErrorFallback } from "@/components/error-fallback/error-fallback";
import { ListCarouselSkeleton } from "@/components/list-carousel/list-carousel-skeleton";
import { SectionHeading } from "@/components/media/section-heading/section-heading";
import { PortraitCard } from "@/components/portrait-card/portrait-card";
import { query } from "@/lib/graphql/client";
import { resolveLocale } from "@/lib/utils/resolve-locale";

import { cn } from "cn";
import { cacheLife } from "next/cache";
import { headers } from "next/headers";
import { Suspense } from "react";

import { GET_ITEM_CAST } from "./_queries/get-item-cast.query";

import type { CastMember } from "@/app/_types/__generated__/graphql";

interface CastMemberCarouselProps {
  cast: CastMember[];
}

function CastMemberCarousel({ cast }: CastMemberCarouselProps) {
  return (
    <Carousel opts={{ dragFree: true, slidesToScroll: "auto" }}>
      <CarouselContent className="-ml-3">
        {cast.map((member) => (
          <CarouselItem key={member.id} className="basis-auto pl-3">
            <PortraitCard
              title={member.name}
              subtitle={member.character}
              image={member.profileUrl}
              className="w-32 md:w-36 lg:w-40"
            />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}

interface ItemCastContentProps {
  id: string;
  locale: string;
}

async function ItemCastContent({ id, locale }: ItemCastContentProps) {
  "use cache";

  cacheLife("days");

  const { data } = await query({
    query: GET_ITEM_CAST,
    variables: {
      id,
      language: locale,
    },
  });

  if (!data?.tmdbItem.cast) {
    return null;
  }

  return <CastMemberCarousel cast={data.tmdbItem.cast} />;
}

interface ItemCastLoaderProps {
  id: string;
}

async function ItemCastLoader({ id }: ItemCastLoaderProps) {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  const locale = resolveLocale(acceptLanguage);

  return <ItemCastContent id={id} locale={locale} />;
}

interface ItemCastProps {
  id: string;
}

export function ItemCast({ id }: ItemCastProps) {
  return (
    <section
      className={cn("mt-8 md:mt-12 animation-duration-400 delay-550", fly)}
    >
      <SectionHeading title="Cast" />
      <ErrorFallback message="Unable to load cast information">
        <Suspense fallback={<ListCarouselSkeleton />}>
          <ItemCastLoader id={id} />
        </Suspense>
      </ErrorFallback>
    </section>
  );
}
