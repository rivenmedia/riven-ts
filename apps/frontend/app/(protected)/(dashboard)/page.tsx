import { Button } from "@/components/ui/button";

import Link from "next/link";

export default async function DashboardPage() {
  const recentlyAddedItems = [];
  const viewAllButtonClass =
    "text-muted-foreground border-white/10 bg-black/20 hover:bg-black/40 hover:text-foreground h-9 w-24 rounded-xl border text-xs font-bold backdrop-blur-md shadow-inner transition-all";

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-linear-to-b from-zinc-900 via-zinc-950 to-black"></div>
        <div className="bg-primary/5 absolute top-[-20%] left-[-10%] h-150 w-150 rounded-full blur-[120px]"></div>
        <div className="absolute right-[-5%] bottom-[-10%] h-125 w-125 rounded-full bg-blue-500/5 blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex w-full flex-col gap-10 pb-24 md:gap-12">
        <div
          // in:fly|global={{ y: 20, duration: 400, delay: 0, easing: cubicOut }}
          className="w-full px-4 md:px-8"
        >
          {/* <TmdbNowPlaying
                data={data.nowPlaying}
                heightClassName="h-[50vh] min-h-[500px] max-h-[800px]" /> */}
        </div>

        <div className="mx-auto flex w-full max-w-600 flex-col gap-12 px-6 md:px-12 lg:px-16">
          {recentlyAddedItems.length > 0 && (
            <div
              // in:fly|global={{ y: 20, duration: 400, delay: 100, easing: cubicOut }}
              className="flex flex-col gap-4"
            >
              {/* {@render listHeading("Recently Added")} */}
              {/* <ListCarousel data={recentlyAddedStore.items} /> */}
            </div>
          )}

          <div
            className="flex flex-col gap-4"
            // in:fly|global={{ y: 20, duration: 400, delay: 150, easing: cubicOut }}
          >
            <div className="mb-1 flex items-center justify-between">
              {/* {@render listHeading("Trending Movies")} */}
              <div className="flex items-center gap-3">
                {/* <AnimatedToggle
                            options={[
                                { label: "Today", value: "day" },
                                { label: "This Week", value: "week" }
                            ]}
                            value={trendingMoviesStore.timeWindow ?? "day"}
                            onChange={(v) =>
                                trendingMoviesStore.changeTimeWindow(v as "day" | "week")} /> */}
                <Button className={viewAllButtonClass} variant="ghost">
                  <Link href="/lists/trending/movie">View All</Link>
                </Button>
              </div>
            </div>
            {/* <ListCarousel data={trendingMoviesStore.items} /> */}
          </div>

          <div
            // in:fly|global={{ y: 20, duration: 400, delay: 200, easing: cubicOut }}
            className="flex flex-col gap-4"
          >
            <div className="mb-1 flex items-center justify-between">
              {/* {@render listHeading("Trending TV Shows")} */}
              <div className="flex items-center gap-3">
                {/* <AnimatedToggle
                            options={[
                                { label: "Today", value: "day" },
                                { label: "This Week", value: "week" }
                            ]}
                            value={trendingShowsStore.timeWindow ?? "day"}
                            onChange={(v) =>
                                trendingShowsStore.changeTimeWindow(v as "day" | "week")} /> */}
                <Button className={viewAllButtonClass} variant="ghost">
                  <Link href="/lists/trending/tv">View All</Link>
                </Button>
              </div>
            </div>
            {/* <ListCarousel data={trendingShowsStore.items} /> */}
          </div>

          <div
            // in:fly|global={{ y: 20, duration: 400, delay: 250, easing: cubicOut }}
            className="flex flex-col gap-4"
          >
            <div className="mb-1 flex items-center justify-between">
              {/* {@render listHeading("Trending Anime")} */}
              <Button className={viewAllButtonClass} variant="ghost">
                <Link href="/lists/trending/anime">View All</Link>
              </Button>
            </div>
            {/* <ListCarousel data={anilistTrendingStore.items} indexer="anilist" /> */}
          </div>
        </div>
      </div>
    </>
  );
}
