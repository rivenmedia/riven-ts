"use client";

import { Button } from "@/components/_ui/button";

import { cn } from "cn";
import { Play, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import type { Trailer } from "@/app/_types/__generated__/graphql";
import type { ItemImage } from "@repo/util-plugin-sdk/dto/types/item-image.type";

export interface HeroBannerProps {
  backdropUrl: string | null | undefined;
  logo: ItemImage | null;
  trailer: Trailer | null | undefined;
}

export function HeroBanner({ backdropUrl, logo, trailer }: HeroBannerProps) {
  const [isTrailerVisible, setIsTrailerVisible] = useState(false);
  const showTrailer = trailer && isTrailerVisible;

  if (!backdropUrl && !trailer) {
    return null;
  }

  return (
    <div className="px-2 md:px-4">
      <div
        className={cn(
          "relative mb-6 flex h-[40vh] max-h-150 min-h-87.5 items-end justify-between overflow-hidden rounded-3xl bg-cover bg-center shadow-2xl transition-all duration-500 md:mb-10",
          !showTrailer && "p-6 md:p-12",
        )}
        style={{
          backgroundImage: backdropUrl ? `url('${backdropUrl}')` : undefined,
        }}
      >
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />
        <div className="border-border/10 pointer-events-none absolute inset-0 rounded-2xl border" />
        {showTrailer ? (
          <>
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&controls=1&mute=0&rel=0&modestbranding=1&playsinline=1`}
              title="Trailer"
              allow="autoplay; encrypted-media"
              allowFullScreen
              // oxlint-disable-next-line react/iframe-missing-sandbox
              sandbox="allow-scripts allow-same-origin"
            />
            <Button
              aria-label="Close trailer"
              variant="ghost"
              size="icon"
              className="bg-background/60 text-foreground hover:bg-background/80 absolute top-4 right-4 z-20"
              onClick={() => {
                setIsTrailerVisible(false);
              }}
              type="button"
            >
              <X className="h-6 w-6" />
            </Button>
          </>
        ) : (
          <div className="z-10 flex w-full justify-between">
            <div
              className="max-h-16 md:max-h-28 lg:max-h-36 max-w-[60%] drop-shadow-2xl"
              style={{ aspectRatio: logo?.aspectRatio }}
            >
              {logo && (
                <Image
                  alt="Logo"
                  src={logo.url}
                  height={logo.height}
                  width={logo.width}
                  loading="eager"
                />
              )}
            </div>

            <div className="flex gap-2 md:gap-4 items-end">
              {trailer && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="border border-white/10 bg-white/10 px-6 text-sm font-bold text-white shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:bg-white/20"
                  onClick={() => {
                    setIsTrailerVisible(true);
                  }}
                  type="button"
                >
                  <Play size={14} className="mr-2 fill-current" />
                  Trailer
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
