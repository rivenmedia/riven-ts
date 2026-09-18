import { logger } from "@/lib/logger";

import { Suspense, use } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { Button } from "../_ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../_ui/carousel";
import { ListItem } from "../list-item/list-item";
import { PortraitCardSkeleton } from "../portrait-card/portrait-card-skeleton";

import type { ComponentProps } from "react";
import type { FallbackProps } from "react-error-boundary";

interface ListCarouselProps {
  itemsPromise: Promise<ComponentProps<typeof ListItem>["mediaItem"][]>;
  indexer: string | undefined;
}

function ListCarouselSkeleton() {
  return (
    <div className="mt-1.5 flex gap-3 overflow-x-hidden pb-2">
      {Array.from({ length: 6 }, (_, i) => i).map((i) => (
        <div key={i} className="w-36 flex-none md:w-44 lg:w-48">
          <PortraitCardSkeleton />
        </div>
      ))}
    </div>
  );
}

function ListCarouselInner({ itemsPromise, indexer }: ListCarouselProps) {
  const items = use(itemsPromise);

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
            className="animate-in fade-in slide-in-from-bottom-8 fill-mode-[backwards] max-w-max pl-3 duration-700 basis-1/3"
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

function ListCarouselErrorFallback({
  error,
  resetErrorBoundary: handleReset,
}: FallbackProps) {
  logger.log(error);

  return (
    <div className="flex flex-col gap-4 p-4">
      Error loading items: {String(error)}
      <div>
        <Button onClick={handleReset} type="button">
          Retry
        </Button>
      </div>
    </div>
  );
}

export function ListCarousel({ indexer, itemsPromise }: ListCarouselProps) {
  return (
    <ErrorBoundary FallbackComponent={ListCarouselErrorFallback}>
      <Suspense fallback={<ListCarouselSkeleton />}>
        <ListCarouselInner indexer={indexer} itemsPromise={itemsPromise} />
      </Suspense>
    </ErrorBoundary>
  );
}
