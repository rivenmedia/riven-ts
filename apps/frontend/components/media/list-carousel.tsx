import { type ComponentProps, Suspense, use } from "react";
import { ErrorBoundary } from "react-error-boundary";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { ListItem } from "./list-item";
import { PortraitCardSkeleton } from "./portrait-card-skeleton";

interface ListCarouselProps {
  itemsPromise: Promise<ComponentProps<typeof ListItem>["mediaItem"][]>;
  indexer: string | undefined;
}

function ListCarouselSkeleton() {
  return (
    <div className="mt-1.5 flex gap-3 overflow-x-auto pb-2">
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
            className="animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards max-w-max pl-3 duration-700 basis-1/3"
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
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

export function ListCarousel(props: ListCarouselProps) {
  return (
    <ErrorBoundary FallbackComponent={() => <div>Error loading items</div>}>
      <Suspense fallback={<ListCarouselSkeleton />}>
        <ListCarouselInner {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
