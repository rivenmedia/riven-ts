import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/_ui/carousel";
import { PortraitCard } from "@/components/portrait-card/portrait-card";

import Link from "next/link";
import React from "react";

import type { IndexerData } from "@/app/_types/__generated__/graphql";

interface MediaCarouselProps {
  items: Pick<IndexerData, "id" | "title" | "type" | "posterUrl" | "year">[];
}

function formatSubtitle({ type, year }: Pick<IndexerData, "type" | "year">) {
  const typeLabel = type === "movie" ? "Movie" : "TV";

  return year ? `${typeLabel} • ${year.toString()}` : typeLabel;
}

export function MediaCarousel({ items }: MediaCarouselProps) {
  return (
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
                  subtitle={formatSubtitle(item)}
                  image={item.posterUrl}
                  className="w-36 md:w-44 lg:w-48"
                />
              </Link>
            </CarouselItem>
          </React.Fragment>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
