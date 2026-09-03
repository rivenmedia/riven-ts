import { Button } from "@/components/_ui/button";
import { cn } from "@/lib/utils";

import { Play, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export interface Trailer {
  id?: string | number;
  name: string;
  site: string | null;
  key: string;
  url?: string | null;
}

export interface HeroBannerProps {
  backdropPath: string | null | undefined;
  logo: string | null | undefined;
  trailer: Trailer | null | undefined;
}

export function HeroBanner({ backdropPath, logo, trailer }: HeroBannerProps) {
  const [isTrailerVisible, setIsTrailerVisible] = useState(false);
  const showTrailer = trailer && isTrailerVisible;

  if (!backdropPath && !trailer) {
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
          backgroundImage: backdropPath ? `url('${backdropPath}')` : undefined,
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
          <div className="relative z-10 flex w-full items-end justify-between">
            {logo && (
              <Image
                alt="Logo"
                className="max-h-16 max-w-[60%] object-contain drop-shadow-2xl md:max-h-28 lg:max-h-36"
                src={logo}
                loading="lazy"
                width={48}
                height={48}
              />
            )}

            <div className="flex gap-2 md:gap-4">
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
