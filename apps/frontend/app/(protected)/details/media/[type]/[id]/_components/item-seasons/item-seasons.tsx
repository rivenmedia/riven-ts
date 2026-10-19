import { cn } from "cn";
import { io } from "next/cache";
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

import { ItemStatusBadge } from "../item-status-badge/item-status-badge";
import { fetchItemSeasons } from "./_data-access/fetch-item-seasons";

import type { IndexerSeason } from "#app/_types/__generated__/graphql.ts";

interface SeasonCarouselProps {
  seasons: IndexerSeason[];
}

function SeasonCarousel({ seasons }: SeasonCarouselProps) {
  return (
    <Carousel opts={{ dragFree: true, slidesToScroll: "auto" }}>
      <CarouselContent>
        {seasons.map(({ episodes, id, number, posterUrl, showId }) => {
          const episodesLength = episodes.length;

          return (
            <CarouselItem key={id} className="basis-auto">
              <PortraitCard
                title={
                  number === 0 ? "Specials" : `Season ${number.toString()}`
                }
                image={posterUrl}
                className="w-28 md:w-32 lg:w-36"
                topRight={
                  <ItemStatusBadge
                    indexerItemId={showId}
                    type="season"
                    seasonNumber={number}
                  />
                }
              />
              {episodes.length > 0 && (
                <div className="mt-1.5 flex items-center gap-1.5 px-0.5">
                  <div className="bg-muted h-1 flex-1 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          // oxlint-disable-next-line oxc/erasing-op
                          (0 / episodesLength) * 100,
                        ).toString()}%`,
                      }}
                    />
                  </div>
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {0}/{episodesLength}
                  </span>
                </div>
              )}
            </CarouselItem>
          );
        })}
      </CarouselContent>
    </Carousel>
  );
}

interface ItemSeasonsLoaderProps {
  id: string;
}

async function ItemSeasonsLoader({ id }: ItemSeasonsLoaderProps) {
  await io();

  const seasons = await fetchItemSeasons(id);

  if (!seasons) {
    return <p>No seasons found.</p>;
  }

  return <SeasonCarousel seasons={seasons} />;
}

interface ItemSeasonsProps {
  id: string;
}

export function ItemSeasons({ id }: ItemSeasonsProps) {
  return (
    <section
      className={cn("mt-8 md:mt-12 animation-duration-400 delay-550", fly)}
    >
      <SectionHeading title="Seasons" />
      <ErrorFallback message="Unable to load seasons information">
        <Suspense fallback={<ListCarouselSkeleton />}>
          <ItemSeasonsLoader id={id} />
        </Suspense>
      </ErrorFallback>
    </section>
  );
}
