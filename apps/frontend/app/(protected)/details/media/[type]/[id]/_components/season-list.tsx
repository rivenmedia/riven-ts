import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "#components/_ui/carousel.tsx";
import { PortraitCard } from "#components/portrait-card/portrait-card.tsx";

import type { IndexerSeason } from "#app/_types/__generated__/graphql.ts";

interface SeasonListProps {
  seasons: IndexerSeason[];
}

export function SeasonList({ seasons }: SeasonListProps) {
  return (
    <Carousel opts={{ dragFree: true, slidesToScroll: "auto" }}>
      <CarouselContent>
        {seasons.map(({ episodes, id, number, posterUrl }) => {
          const episodesLength = episodes.length;

          return (
            <CarouselItem key={id} className="basis-auto">
              <PortraitCard
                title={
                  number === 0 ? "Specials" : `Season ${number.toString()}`
                }
                image={posterUrl}
                className="w-28 md:w-32 lg:w-36"
                // topRight={
                //   rivenSeason?.state && (
                //     <StatusBadge state={rivenSeason.state} large />
                //   )
                // }
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
