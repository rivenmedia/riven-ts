import { fly } from "@/components/_animations/fly";
import { ImmersiveBackground } from "@/components/immersive-background/immersive-background";
import { PageShell } from "@/components/page-shell/page-shell";

import { cn } from "cn";

import { RecentlyAdded } from "./_components/recently-added";
import { TMDBNowPlaying } from "./_components/tmdb-now-playing";
import { TrendingMovies } from "./_components/trending-movies";
import { TrendingShows } from "./_components/trending-shows";

export function HomePage() {
  return (
    <PageShell className="bg-background relative mt-0 flex min-h-screen flex-col overflow-x-hidden p-0 md:mt-0 md:p-0">
      <ImmersiveBackground />
      <div className="relative z-10 flex w-full flex-col gap-10 pb-24 md:gap-12">
        <div className={cn("w-full px-4 md:px-8", fly)}>
          <TMDBNowPlaying heightClass="h-[50vh] min-h-[500px] max-h-[800px]" />
        </div>
        <div className="mx-auto flex w-full max-w-600 flex-col gap-12 px-6 md:px-12 lg:px-16">
          <RecentlyAdded />
          <div className={cn("flex flex-col gap-4 delay-150", fly)}>
            <TrendingMovies />
          </div>
          <div className={cn("flex flex-col gap-4 delay-200", fly)}>
            <TrendingShows />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
