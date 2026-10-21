import { PortraitCardSkeleton } from "#components/portrait-card/portrait-card-skeleton.tsx";

export default function ExploreLoading() {
  return [...Array.from({ length: 20 }).keys()].map((index) => (
    <PortraitCardSkeleton key={index} />
  ));
}
