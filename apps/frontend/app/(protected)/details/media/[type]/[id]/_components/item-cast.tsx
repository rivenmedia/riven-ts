import { fly } from "@/components/_animations/fly";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/_ui/carousel";
import { SectionHeading } from "@/components/media/section-heading/section-heading";
import { PortraitCard } from "@/components/portrait-card/portrait-card";

import { cn } from "cn";

import type { GetMediaItemQuery } from "../_queries/get-media-item.query.typegen";

interface ItemCastProps {
  data: GetMediaItemQuery;
}

export function ItemCast({ data }: ItemCastProps) {
  return (
    <section
      className={cn("mt-8 md:mt-12 animation-duration-400 delay-550", fly)}
    >
      <SectionHeading title="Cast" />
      <Carousel opts={{ dragFree: true, slidesToScroll: "auto" }}>
        <CarouselContent className="-ml-3">
          {data.mediaDetails.details.cast.map((member) => (
            <CarouselItem key={member.id} className="basis-auto pl-3">
              <PortraitCard
                title={member.name}
                subtitle={member.character}
                image={member.profilePath}
                className="w-32 md:w-36 lg:w-40"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
