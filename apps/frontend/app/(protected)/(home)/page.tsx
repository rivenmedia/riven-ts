import { cn } from "cn";

import { fly } from "#components/_animations/fly.ts";

import { RecentlyAdded } from "./_components/recently-added.tsx";
import { TMDBNowPlaying } from "./_components/tmdb-now-playing/tmdb-now-playing.tsx";
import { TMDBTrendingMovies } from "./_components/tmdb-trending-movies/tmdb-trending-movies.tsx";
import { TVDBTrendingShows } from "./_components/tvdb-trending-shows/tvdb-trending-shows.tsx";

export default function HomePage() {
  return (
    <div className="relative z-10 flex w-full flex-col gap-10 pb-24 md:gap-12">
      <div className={cn("w-full px-4 md:px-8 fill-mode-backwards", fly)}>
        <TMDBNowPlaying heightClass="h-[50vh] min-h-[500px] max-h-[800px]" />
      </div>
      <div className="mx-auto flex w-full max-w-600 flex-col gap-12 px-6 md:px-12 lg:px-16">
        <RecentlyAdded />
        <div
          className={cn(
            "flex flex-col gap-4 delay-150 fill-mode-backwards",
            fly,
          )}
        >
          <TMDBTrendingMovies />
        </div>
        <div
          className={cn(
            "flex flex-col gap-4 delay-200 fill-mode-backwards",
            fly,
          )}
        >
          <TVDBTrendingShows />
        </div>
      </div>
    </div>
  );
}
