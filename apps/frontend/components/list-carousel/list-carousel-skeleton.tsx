import { PortraitCardSkeleton } from "../portrait-card/portrait-card-skeleton";

export function ListCarouselSkeleton() {
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
