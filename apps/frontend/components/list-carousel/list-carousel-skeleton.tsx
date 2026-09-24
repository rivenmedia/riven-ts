import { PortraitCardSkeleton } from "../portrait-card/portrait-card-skeleton";

export function ListCarouselSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-clip">
      {Array.from({ length: 6 }, (_, i) => i).map((i) => (
        <div key={i} className="w-36 flex-none md:w-44 lg:w-48">
          <PortraitCardSkeleton />
        </div>
      ))}
    </div>
  );
}
