import { TrendingDiscoveryPage } from "#app/(protected)/lists/trending/_components/trending-discovery-page/trending-discovery-page.tsx";

export default function TrendingMoviesPage() {
  return (
    <TrendingDiscoveryPage
      emptyMessage="No movies found"
      mediaType="movie"
      title="Trending Movies"
    />
  );
}
