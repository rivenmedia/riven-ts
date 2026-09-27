import { cn } from "cn";
import Autoplay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade";
import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { startTransition, useEffect, useState } from "react";
import { useHoverDirty } from "react-use";

import { fly } from "../_animations/fly";
import { Button } from "../_ui/button";
import { Carousel, CarouselContent, CarouselItem } from "../_ui/carousel";
import { getAlignmentClasses } from "./_utilities/get-alignment-classes";

import type { CarouselApi } from "../_ui/carousel";
import type { Genre } from "@/app/_types/__generated__/graphql";
import type { TopLevelMediaItemType } from "@repo/util-plugin-sdk/dto/enums/top-level-media-item-type.enum";
import type { RefObject } from "react";

export interface RatingScore {
  name: string;
  image?: string;
  score: string;
  url: string;
}

export interface NowPlayingItem {
  id: string;
  mediaType: TopLevelMediaItemType;
  title?: string;
  name?: string;
  backdropPath?: string | null;
  releaseDate: string;
  voteAverage?: number | null;
  originalLanguage?: string;
  overview?: string;
  genres?: Genre[];
  certification: string;
  ratings: RatingScore[];
  logo: string | null;
}

export interface NowPlayingProps {
  data: NowPlayingItem[];
  autoplayDelay?: number;
  alignment?: "left" | "center" | "right";
  heightClass?: string;
}

export function NowPlaying({
  data,
  alignment = "left",
  heightClass = "h-[350px] md:h-[420px]",
  autoplayDelay = 5000,
}: NowPlayingProps) {
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
            const isTV = item.mediaType === "show";
            const displayTitle = item.title ?? item.name ?? "Untitled";

            const backgroundGradient =
              "radial-gradient(120% 160% at 0% 100%, black 0%, transparent 70%), linear-gradient(to bottom, transparent 10%, black 100%)";

            const animationClass = i === currentIndex ? fly : "hidden";

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
                        "flex h-24 items-end delay-100 animation-duration-1000",
                        animationClass,
                      )}
                    >
                      {item.logo ? (
                        <div className="mb-4 relative w-full h-[10vw] max-h-35 max-w-125">
                          <Image
                            src={item.logo}
                            alt={displayTitle}
                            className={cn(
                              "max-h-full max-w-[80%] drop-shadow-2xl object-contain",
                              alignment === "left" && "object-bottom-left",
                              alignment === "right" && "object-bottom-right",
                              alignment === "center" && "object-bottom",
                            )}
                            fill
                          />
                        </div>
                      ) : (
                        <h1 className="line-clamp-2 font-black tracking-tighter drop-shadow-2xl md:leading-[1.1] text-[clamp(var(--text-3xl),5vw,var(--text-6xl))]">
                          {displayTitle}
                        </h1>
                      )}
                    </div>
                    <div
                      className={cn(
                        "mt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-white md:mt-4 md:text-sm delay-200 animation-duration-1000",
                        getAlignmentClasses(alignment, "flex"),
                        animationClass,
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
                          "mt-3 line-clamp-2 max-w-xl text-xs leading-relaxed text-white/90 drop-shadow-md md:mt-4 md:text-base delay-300 animation-duration-1000",
                          animationClass,
                        )}
                      >
                        {item.overview}
                      </p>
                    )}
                    {item.genres?.length && (
                      <div
                        className={cn(
                          "mt-4 flex flex-wrap gap-2 md:mt-6 delay-400 animation-duration-1000",
                          getAlignmentClasses(alignment, "flex"),
                          animationClass,
                        )}
                      >
                        {item.genres.slice(0, 4).map((genre) => (
                          <div
                            key={genre.id}
                            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20"
                          >
                            {genre.name}
                          </div>
                        ))}
                      </div>
                    )}
                    <div
                      className={cn(
                        "mt-6 flex flex-wrap gap-4 md:mt-8 delay-500 animation-duration-1000",
                        getAlignmentClasses(alignment, "flex"),
                        animationClass,
                      )}
                    >
                      <Button
                        asChild
                        size="lg"
                        className="flex h-10 items-center justify-center rounded-md border border-white/10 bg-white/10 px-8 text-sm font-bold text-white shadow-sm backdrop-blur-md transition-all hover:scale-[1.02] hover:bg-white/20 md:h-12 md:text-base"
                        type="button"
                      >
                        <Link
                          href={`/details/media/${item.mediaType}/${item.id}`}
                        >
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
