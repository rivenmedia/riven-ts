import { TrendingDiscoveryPage } from "../_components/trending-discovery-page/trending-discovery-page";

export default function TrendingShowsPage() {
  return (
    <TrendingDiscoveryPage
      emptyMessage="No shows found"
      mediaType="show"
      title="Trending Shows"
    />
  );
}
