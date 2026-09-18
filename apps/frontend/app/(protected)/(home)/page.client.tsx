import { fly } from "@/components/_animations/fly";
import { Button } from "@/components/_ui/button";
import { AnimatedToggle } from "@/components/animated-toggle/animated-toggle";
import { ImmersiveBackground } from "@/components/immersive-background/immersive-background";
import { ListCarousel } from "@/components/list-carousel/list-carousel";
import { SectionHeading } from "@/components/media/section-heading/section-heading";
import { PageShell } from "@/components/page-shell/page-shell";
import { TmdbNowPlaying } from "@/components/tmdb-now-playing/tmdb-now-playing";

import { cn } from "cn";
import Link from "next/link";

import type { TMDBNowPlayingItem } from "@/components/tmdb-now-playing/tmdb-now-playing";

interface HomePageProps {
  nowPlaying: TMDBNowPlayingItem[];
  trendingMoviesPromise: Promise<any>;
  trendingShowsPromise: Promise<any>;
}

export function HomePage({
  nowPlaying,
  trendingMoviesPromise,
  trendingShowsPromise,
}: HomePageProps) {
  const viewAllButtonClass =
    "text-muted-foreground border-white/10 bg-black/20 hover:bg-black/40 hover:text-foreground h-9 w-24 rounded-xl border text-xs font-bold backdrop-blur-md shadow-inner transition-all";

  const recentlyAdded = [1];

  return (
    <PageShell className="bg-background relative mt-0 flex min-h-screen flex-col overflow-x-hidden p-0 md:mt-0 md:p-0">
      <ImmersiveBackground />
      <div className="relative z-10 flex w-full flex-col gap-10 pb-24 md:gap-12">
        <div className={cn("w-full px-4 md:px-8", fly)}>
          <TmdbNowPlaying
            data={nowPlaying}
            heightClass="h-[50vh] min-h-[500px] max-h-[800px]"
          />
        </div>
        <div className="mx-auto flex w-full max-w-600 flex-col gap-12 px-6 md:px-12 lg:px-16">
          {recentlyAdded.length > 0 && (
            <div className={cn("flex flex-col gap-4 delay-100", fly)}>
              <SectionHeading title="Recently Added" />
              {/* <ListCarousel data={recentlyAdded} /> */}
            </div>
          )}
          <div className={cn("flex flex-col gap-4 delay-150", fly)}>
            <div className="mb-1 flex items-center justify-between">
              <SectionHeading title="Trending Movies" />
              <div className="flex items-center gap-3">
                <AnimatedToggle
                  options={[
                    { label: "Today", value: "day" },
                    { label: "This Week", value: "week" },
                  ]}
                  onChange={() => {}}
                  // value={trendingMoviesStore.timeWindow ?? "day"}
                  // onChange={(v) =>
                  //   trendingMoviesStore.changeTimeWindow(v as "day" | "week")
                  // }
                />
                <Button
                  asChild
                  className={viewAllButtonClass}
                  variant="ghost"
                  type="button"
                >
                  <Link href="/lists/trending/movie">View All</Link>
                </Button>
              </div>
            </div>
            <ListCarousel itemsPromise={trendingMoviesPromise} indexer="tmdb" />
          </div>
          <div className={cn("flex flex-col gap-4 delay-200", fly)}>
            <div className="mb-1 flex items-center justify-between">
              <SectionHeading title="Trending TV Shows" />
              <div className="flex items-center gap-3">
                <AnimatedToggle
                  options={[
                    { label: "Today", value: "day" },
                    { label: "This Week", value: "week" },
                  ]}
                  onChange={() => {}}
                  // value={trendingShowsStore.timeWindow ?? "day"}
                  // onChange={(v) =>
                  //   trendingShowsStore.changeTimeWindow(v as "day" | "week")
                  // }
                />
                <Button
                  asChild
                  className={viewAllButtonClass}
                  variant="ghost"
                  type="button"
                >
                  <Link href="/lists/trending/tv">View All</Link>
                </Button>
              </div>
            </div>
            <ListCarousel itemsPromise={trendingShowsPromise} indexer="tvdb" />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
