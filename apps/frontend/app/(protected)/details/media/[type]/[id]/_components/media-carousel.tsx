import { fly } from "@/components/_animations/fly";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/_ui/carousel";
import { SectionHeading } from "@/components/media/section-heading/section-heading";
import { PortraitCard } from "@/components/portrait-card/portrait-card";

import { cn } from "cn";
import Link from "next/link";
import React from "react";

import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

interface MediaCarouselProps {
  items: Pick<MediaItem, "id" | "title" | "posterPath" | "type" | "year">[];
  title: string;
  delay: number;
}

export function MediaCarousel({ items, title, delay }: MediaCarouselProps) {
  return (
    <section
      className={cn("mt-8 md:mt-12 animation-duration-400", fly)}
      style={{ animationDelay: `${delay.toString()}ms` }}
    >
      <SectionHeading title={title} />
      <Carousel opts={{ dragFree: true, slidesToScroll: "auto" }}>
        <CarouselContent className="-ml-3">
          {items.map((item) => (
            <React.Fragment key={`${item.type}-${item.id}`}>
              <CarouselItem className="basis-auto pl-3">
                <Link
                  href={`/details/media/${item.type}/${item.id}`}
                  className="group relative block opacity-80 transition-all duration-300 hover:opacity-100"
                >
                  <PortraitCard
                    title={item.title}
                    subtitle={`${item.type === "movie" ? "Movie" : "TV"}${item.year ? ` • ${item.year.toString()}` : ""}`}
                    image={item.posterPath}
                    className="w-36 md:w-44 lg:w-48"
                  />
                </Link>
              </CarouselItem>
            </React.Fragment>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
