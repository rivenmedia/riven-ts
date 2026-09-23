import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/_ui/carousel";
import { PortraitCard } from "@/components/portrait-card/portrait-card";

import type { SeasonData } from "./season-selector";

interface SeasonListProps {
  seasons: SeasonData[];
}

export function SeasonList({ seasons }: SeasonListProps) {
  return (
    <Carousel opts={{ dragFree: true, slidesToScroll: "auto" }}>
      <CarouselContent>
        {seasons.map(
          ({ completedCount, episodeCount, id, image, seasonNumber }) => (
            <CarouselItem key={id} className="basis-auto">
              <PortraitCard
                title={
                  seasonNumber === 0
                    ? "Specials"
                    : `Season ${seasonNumber.toString()}`
                }
                image={image}
                className="w-28 md:w-32 lg:w-36"
                // topRight={
                //   rivenSeason?.state && (
                //     <StatusBadge state={rivenSeason.state} large />
                //   )
                // }
              />
              {episodeCount > 0 && (
                <div className="mt-1.5 flex items-center gap-1.5 px-0.5">
                  <div className="bg-muted h-1 flex-1 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (completedCount / episodeCount) * 100,
                        ).toString()}%`,
                      }}
                    />
                  </div>
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {completedCount}/{episodeCount}
                  </span>
                </div>
              )}
            </CarouselItem>
          ),
        )}
      </CarouselContent>
    </Carousel>
  );
}
