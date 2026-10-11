import { TrendingDiscoveryPage } from "#app/(protected)/lists/trending/_components/trending-discovery-page/trending-discovery-page.tsx";

export default function TrendingShowsPage() {
  return (
    <TrendingDiscoveryPage
      emptyMessage="No shows found"
      mediaType="show"
      title="Trending Shows"
    />
  );
}
