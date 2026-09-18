import { cn } from "cn";
import Autoplay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade";
import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { startTransition, useEffect, useState } from "react";
import { useHoverDirty } from "react-use";

import { Button } from "../_ui/button";
import { Carousel, CarouselContent, CarouselItem } from "../_ui/carousel";
import { getAlignmentClasses } from "./_utilities/get-alignment-classes";
import { TmdbNowPlayingSkeleton } from "./tmdb-now-playing-skeleton";

import type { CarouselApi } from "../_ui/carousel";
import type { RefObject } from "react";

const TMDB_GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10_751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10_402: "Music",
  9648: "Mystery",
  10_749: "Romance",
  878: "Sci-Fi",
  10_770: "TV Movie",
  53: "Thriller",
  10_752: "War",
  37: "Western",
  10_759: "Action & Adventure",
  10_762: "Kids",
  10_763: "News",
  10_764: "Reality",
  10_765: "Sci-Fi & Fantasy",
  10_766: "Soap",
  10_767: "Talk",
  10_768: "War & Politics",
};

export interface RatingScore {
  name: string;
  image?: `${"imdb" | `rottentomatoes${"" | "_audience" | "_certified"}_fresh` | `rottentomatoes${"" | "_audience"}_rotten`}.svg`;
  score: string;
  url: string;
}

export interface TMDBNowPlayingItem {
  id: string;
  mediaType?: "movie" | "tv" | "person" | "company";
  title?: string;
  name?: string;
  backdropPath?: string | null;
  releaseDate?: string;
  firstAirDate?: string;
  voteAverage?: number | null;
  originalLanguage?: string;
  overview?: string;
  genreIds?: number[];
  certification: string;
  ratings: RatingScore[];
  logo: string | null;
}

export interface TmdbNowPlayingProps {
  autoplayDelay?: number;
  data?: TMDBNowPlayingItem[];
  showRequestButton?: boolean;
  alignment?: "left" | "center" | "right";
  heightClass?: string;
}

export function TmdbNowPlaying({
  data,
  showRequestButton = true,
  alignment = "left",
  heightClass = "h-[350px] md:h-[420px]",
  autoplayDelay = 5000,
}: TmdbNowPlayingProps) {
  const [autoplayPlugin, fadePlugin] = [
    Autoplay({
      delay: autoplayDelay,
      stopOnMouseEnter: true,
    }),
    Fade(),
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const [api, setApi] = React.useState<CarouselApi>();
  const carouselRef = React.useRef<HTMLDivElement>(null);

  const isCarouselHovered = useHoverDirty(
    carouselRef as RefObject<Element>,
    Boolean(carouselRef.current),
  );

  useEffect(() => {
    if (!api) {
      return;
    }

    const { autoplay } = api.plugins();

    if (isCarouselHovered) {
      autoplay.stop();
    } else {
      autoplay.play();
    }
  }, [api, isCarouselHovered]);

  useEffect(() => {
    if (!api) {
      return;
    }

    api.plugins().autoplay.reset();
  }, [api, currentIndex]);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrentIndex(api.selectedScrollSnap());

    api.on("select", () => {
      startTransition(() => {
        setCurrentIndex(api.selectedScrollSnap());
      });
    });
  }, [api]);

  if (!data || data.length === 0) {
    return <TmdbNowPlayingSkeleton />;
  }

  return (
    <div className="border-border/50 relative overflow-hidden rounded-2xl border shadow-2xl">
      <Carousel
        setApi={setApi}
        plugins={[autoplayPlugin, fadePlugin]}
        opts={{ duration: 40, loop: true, watchDrag: false }}
        className="relative"
        aria-label="Now playing movies carousel"
        ref={carouselRef}
      >
        <CarouselContent>
          {data.map((item, i) => {
            const isTV = item.mediaType === "tv";
            const mediaType = isTV ? "tv" : "movie";
            const displayTitle = item.title ?? item.name ?? "Untitled";

            const backgroundGradient =
              "radial-gradient(120% 160% at 0% 100%, black 0%, transparent 70%), linear-gradient(to bottom, transparent 10%, black 100%)";

            function getAnimationClass(delay: number) {
              return i === currentIndex
                ? `animate-(--animate-fly-in) delay-${delay.toString()}`
                : "hidden";
            }

            return (
              <CarouselItem
                key={item.id}
                className={cn("relative w-full", heightClass)}
              >
                {item.backdropPath && (
                  <Image
                    src={item.backdropPath}
                    alt={displayTitle}
                    className="absolute h-full w-full object-cover object-top select-none"
                    loading="lazy"
                    fill
                  />
                )}
                <div
                  className="bg-background pointer-events-none absolute top-0 right-0 bottom-0 left-0"
                  style={{
                    WebkitMaskImage: backgroundGradient,
                    maskImage: backgroundGradient,
                  }}
                />
                <div
                  className={cn(
                    "absolute top-0 right-0 bottom-0 left-0 z-10 flex flex-col justify-end px-8 pt-2 pb-24 md:px-32 md:pt-8 md:pb-16 lg:right-0 lg:left-0",
                    getAlignmentClasses(alignment, "container"),
                  )}
                >
                  <div className="flex w-full max-w-3xl flex-col">
                    <div
                      className={cn(
                        "flex h-24 items-end",
                        getAnimationClass(100),
                      )}
                    >
                      {item.logo ? (
                        <div className="mb-4 relative w-full h-16">
                          <Image
                            src={item.logo}
                            alt={displayTitle}
                            className={cn(
                              "max-h-full max-w-[80%] drop-shadow-2xl",
                              alignment === "left" && "object-bottom-left",
                              alignment === "right" && "object-bottom-right",
                              alignment === "center" && "object-bottom",
                            )}
                            fill
                            objectFit="contain"
                          />
                        </div>
                      ) : (
                        <h1 className="line-clamp-2 font-black tracking-tighter drop-shadow-2xl md:leading-[1.1] text-[clamp(var(--text-3xl),5vw,var(--text-4xl))]">
                          {displayTitle}
                        </h1>
                      )}
                    </div>
                    <div
                      className={cn(
                        "mt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-white md:mt-4 md:text-sm",
                        getAlignmentClasses(alignment, "flex"),
                        getAnimationClass(200),
                      )}
                    >
                      <span className="flex items-center justify-center rounded-md border border-white/20 bg-white/10 px-2 py-1 text-[10px] leading-none font-bold tracking-wider uppercase backdrop-blur-md md:text-xs">
                        {isTV ? "Series" : "Movie"}
                      </span>
                      {item.certification && (
                        <>
                          <span className="text-white/40">|</span>
                          <span className="flex items-center justify-center rounded-sm border border-white/40 px-1.5 py-1 text-[10px] leading-none font-bold tracking-wider uppercase md:text-xs">
                            {item.certification}
                          </span>
                        </>
                      )}
                      <span className="text-white/40">|</span>
                      <span className="text-white drop-shadow-md">
                        {/* {getSeasonAndYear(
                            item.releaseDate ?? item.firstAirDate ?? "",
                          )} */}
                      </span>
                      {item.originalLanguage && (
                        <>
                          <span className="text-white/40">|</span>
                          <span className="text-white uppercase drop-shadow-md">
                            {item.originalLanguage}
                          </span>
                        </>
                      )}
                      {item.ratings.length > 0 && (
                        <div className="ml-2 flex items-center gap-4">
                          {item.ratings.map((score) => (
                            <a
                              key={score.name}
                              href={score.url}
                              target="_blank"
                              rel="external noopener noreferrer"
                              className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
                              title={score.name}
                            >
                              {score.image && (
                                <div className="relative h-8 w-8">
                                  <Image
                                    src={`/rating-logos/${score.image}`}
                                    alt={score.name}
                                    className="h-4 w-auto object-contain"
                                    fill
                                  />
                                </div>
                              )}
                              <span className="text-xs font-bold text-white drop-shadow-md">
                                {score.score}
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                      {item.ratings.length === 0 && item.voteAverage && (
                        <>
                          {" "}
                          <span className="text-white/40">|</span>
                          <span className="flex items-center font-bold text-white drop-shadow-md">
                            <Star className="mr-1 h-3.5 w-3.5 fill-current text-yellow-500" />
                            {item.voteAverage.toFixed(1)}
                          </span>
                        </>
                      )}
                    </div>
                    {item.overview && (
                      <p
                        className={cn(
                          "mt-3 line-clamp-2 max-w-xl text-xs leading-relaxed text-white/90 drop-shadow-md md:mt-4 md:text-base",
                          getAnimationClass(300),
                        )}
                      >
                        {item.overview}
                      </p>
                    )}
                    {item.genreIds?.length && (
                      <div
                        className={cn(
                          "mt-4 flex flex-wrap gap-2 md:mt-6",
                          getAlignmentClasses(alignment, "flex"),
                          getAnimationClass(400),
                        )}
                      >
                        {item.genreIds.slice(0, 4).map(
                          (genreId) =>
                            TMDB_GENRES[genreId] && (
                              <div
                                key={genreId.toString()}
                                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20"
                              >
                                {TMDB_GENRES[genreId]}
                              </div>
                            ),
                        )}
                      </div>
                    )}
                    <div
                      className={cn(
                        "mt-6 flex flex-wrap gap-4 md:mt-8",
                        getAlignmentClasses(alignment, "flex"),
                        getAnimationClass(500),
                      )}
                    >
                      {showRequestButton && (
                        <Button
                          asChild
                          variant="default"
                          size="lg"
                          className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-10 items-center justify-center rounded-md px-8 text-sm font-bold shadow-sm transition-all hover:scale-[1.02] md:h-12 md:text-base"
                          type="button"
                        >
                          <Link href={`/watch/${item.id}`}>Request</Link>
                        </Button>
                      )}
                      <Button
                        asChild
                        variant="secondary"
                        size="lg"
                        className="flex h-10 items-center justify-center rounded-md border border-white/10 bg-white/10 px-8 text-sm font-bold text-white shadow-sm backdrop-blur-md transition-all hover:scale-[1.02] hover:bg-white/20 md:h-12 md:text-base"
                        type="button"
                      >
                        <Link href={`/details/media/${item.id}/${mediaType}`}>
                          More Info
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-between px-4">
        <button
          className="pointer-events-auto hidden h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/70 backdrop-blur-md transition-all hover:scale-110 hover:bg-black/40 hover:text-white md:flex"
          onClick={() => api?.scrollPrev()}
          aria-label="Previous slide"
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          className="pointer-events-auto hidden h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/70 backdrop-blur-md transition-all hover:scale-110 hover:bg-black/40 hover:text-white md:flex"
          onClick={() => api?.scrollNext()}
          aria-label="Next slide"
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
      <div className="absolute bottom-4 left-1/2 z-20 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-4 rounded-full border border-white/10 bg-black/30 px-4 py-2 backdrop-blur-xl md:px-6 md:py-2.5">
        <span className="font-mono text-xs font-medium whitespace-nowrap text-white/90">
          {currentIndex + 1} / {data.length}
        </span>

        {/* <!-- Desktop Segmented Progress (Hidden until Large screens) --> */}
        <div className="hidden gap-1.5 lg:flex">
          {data.map(({ id }, i) => (
            <button
              key={id}
              className={cn(
                "relative h-1 w-6 cursor-pointer overflow-hidden rounded-full transition-all duration-300",
                i === currentIndex
                  ? "bg-white/20"
                  : "bg-white/20 hover:bg-white/40",
              )}
              onClick={() => api?.scrollTo(i)}
              aria-label={`Go to slide ${(i + 1).toString()}`}
              type="button"
            >
              {i === currentIndex && (
                <div
                  className={cn(
                    !isCarouselHovered && "animate-progress",
                    "bg-primary absolute top-0 bottom-0 left-0",
                  )}
                />
              )}
            </button>
          ))}
          <style jsx>{`
            @keyframes progress {
              from {
                width: 0%;
              }

              to {
                width: 100%;
              }
            }

            .animate-progress {
              animation: progress ${(autoplayDelay / 1000).toString()}s linear;
            }
          `}</style>
        </div>

        {/* <!-- Mobile/Tablet Simple Progress Bar --> */}
        <div className="h-1 w-32 overflow-hidden rounded-full bg-white/20 lg:hidden">
          <div
            className="bg-primary h-full transition-all duration-300 ease-out"
            style={{
              width: `${(((currentIndex + 1) / data.length) * 100).toString()}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
