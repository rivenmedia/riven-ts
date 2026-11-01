import Link from "next/link";
import React from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "#components/_ui/carousel.tsx";
import { PortraitCard } from "#components/portrait-card/portrait-card.tsx";

import type { IndexerData } from "#app/_types/__generated__/graphql.ts";

interface MediaCarouselProps {
  items: Pick<
    IndexerData,
    "id" | "title" | "type" | "posterUrl" | "year" | "isRequestable"
  >[];
}

function formatSubtitle({
  type,
  year,
  isRequestable,
}: Pick<IndexerData, "type" | "year" | "isRequestable">) {
  const typeLabel = type === "movie" ? "Movie" : "TV";

  return [typeLabel, year?.toString(), !isRequestable && "Not requestable"]
    .filter(Boolean)
    .join(" • ");
}

export function MediaCarousel({ items }: MediaCarouselProps) {
  function renderCardContents(item: MediaCarouselProps["items"][number]) {
    return (
      <PortraitCard
        title={item.title}
        subtitle={formatSubtitle(item)}
        image={item.posterUrl}
        className="w-36 md:w-44 lg:w-48"
      />
    );
  }

  return (
    <Carousel opts={{ dragFree: true, slidesToScroll: "auto" }}>
      <CarouselContent className="-ml-3">
        {items.map((item) => (
          <React.Fragment key={`${item.type}-${item.id}`}>
            <CarouselItem className="basis-auto pl-3">
              {item.isRequestable ? (
                <Link
                  href={`/details/media/${item.type}/${item.id}`}
                  className="group relative block opacity-80 transition-all duration-300 hover:opacity-100"
                >
                  {renderCardContents(item)}
                </Link>
              ) : (
                // Items that can't be requested (e.g. shows without a TVDB ID) have no details page
                <div
                  aria-disabled="true"
                  className="group relative block opacity-50"
                >
                  {renderCardContents(item)}
                </div>
              )}
            </CarouselItem>
          </React.Fragment>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
