import { cn } from "cn";
import { headers } from "next/headers";
import { Suspense } from "react";

import { fly } from "#components/_animations/fly.ts";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "#components/_ui/carousel.tsx";
import { ErrorFallback } from "#components/error-fallback/error-fallback.tsx";
import { ListCarouselSkeleton } from "#components/list-carousel/list-carousel-skeleton.tsx";
import { SectionHeading } from "#components/media/section-heading/section-heading.tsx";
import { PortraitCard } from "#components/portrait-card/portrait-card.tsx";
import { resolveLocale } from "#lib/utils/resolve-locale.ts";

import type { CastMember } from "#app/_types/__generated__/graphql.ts";
import type { HTMLAttributes } from "react";

type Cast = Pick<CastMember, "id" | "name" | "character" | "profileUrl">[];

interface CastMemberCarouselProps {
  cast: Cast;
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

interface CastSectionProps extends Pick<
  HTMLAttributes<HTMLElement>,
  "className"
> {
  /**
   * Fetches the cast, localised to the given locale.
   */
  fetchCast: (locale: string) => Promise<Cast | null>;
}

async function CastLoader({ fetchCast }: Pick<CastSectionProps, "fetchCast">) {
  const headersList = await headers();
  const locale = resolveLocale(headersList.get("accept-language"));
  const cast = await fetchCast(locale);

  if (!cast) {
    return <p className="text-muted-foreground">No cast information found.</p>;
  }

  return <CastMemberCarousel cast={cast} />;
}

/**
 * Cast carousel section for the media details pages.
 */
export function CastSection({ className, fetchCast }: CastSectionProps) {
  return (
    <section
      className={cn("mt-8 md:mt-12 animation-duration-400", fly, className)}
    >
      <SectionHeading title="Cast" />
      <ErrorFallback message="Unable to load cast information">
        <Suspense fallback={<ListCarouselSkeleton />}>
          <CastLoader fetchCast={fetchCast} />
        </Suspense>
      </ErrorFallback>
    </section>
  );
}
