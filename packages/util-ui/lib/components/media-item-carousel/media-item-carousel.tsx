import Link from "next/link";
import React from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "#components/_ui/carousel.tsx";
import { PortraitCard } from "#components/portrait-card/portrait-card.tsx";

import type { IndexerData } from "@repo/util-plugin-sdk/dto/types/indexer-data.type";

interface MediaCarouselProps {
  items: Pick<IndexerData, "id" | "title" | "type" | "posterUrl" | "year">[];
  buildLink: (item: Pick<IndexerData, "id" | "type">) => string;
}

function formatSubtitle({ type, year }: Pick<IndexerData, "type" | "year">) {
  const typeLabel = type === "movie" ? "Movie" : "TV";

  return year ? `${typeLabel} • ${year.toString()}` : typeLabel;
}

export function MediaCarousel({ items, buildLink }: MediaCarouselProps) {
  return (
    <Carousel opts={{ dragFree: true, slidesToScroll: "auto" }}>
      <CarouselContent className="-ml-3">
        {items.map((item) => (
          <React.Fragment key={`${item.type}-${item.id}`}>
            <CarouselItem className="basis-auto pl-3">
              <Link
                href={buildLink(item)}
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
