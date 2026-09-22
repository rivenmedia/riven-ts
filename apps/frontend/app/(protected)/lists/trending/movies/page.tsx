import { TrendingDiscoveryPage } from "../_components/trending-discovery-page/trending-discovery-page";

export default function TrendingMoviesPage() {
  return (
    <TrendingDiscoveryPage
      emptyMessage="No movies found"
      mediaType="movie"
      title="Trending Movies"
    />
  );
}
