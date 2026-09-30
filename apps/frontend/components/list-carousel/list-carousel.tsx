import { cn } from "cn";

import { fly } from "../_animations/fly";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../_ui/carousel";
import { ListItem } from "../list-item/list-item";

import type { ComponentProps } from "react";

interface ListCarouselProps {
  items: ComponentProps<typeof ListItem>["mediaItem"][];
  indexer: string | undefined;
  ignoreAnimation?: boolean;
}

export function ListCarousel({
  items,
  indexer,
  ignoreAnimation,
}: ListCarouselProps) {
  return (
    <Carousel
      opts={{
        dragFree: true,
        slidesToScroll: "auto",
      }}
      className="mt-0"
    >
      <CarouselContent className="-ml-3">
        {items.map((item, i) => (
          <CarouselItem
            key={item.id}
            className={cn(
              "max-w-max pl-3 animation-duration-700 basis-1/3",
              !ignoreAnimation && fly,
            )}
            style={{ animationDelay: `${(i * 50).toString()}ms` }}
          >
            <ListItem
              mediaItem={item}
              indexer={indexer}
              className="w-36 md:w-44 lg:w-48"
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious type="button" />
      <CarouselNext type="button" />
    </Carousel>
  );
}
