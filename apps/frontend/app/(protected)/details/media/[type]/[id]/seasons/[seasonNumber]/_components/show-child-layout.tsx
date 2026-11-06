import Image from "next/image";

import { BackdropBackground } from "#components/media/backdrop-background/backdrop-background.tsx";
import { HeroBanner } from "#components/media/hero-banner/hero-banner.tsx";

import type { GetSeasonQuery } from "../_queries/get-season.query.typegen.ts";
import type { PropsWithChildren } from "react";

interface ShowChildLayoutProps {
  show: Pick<GetSeasonQuery["tmdbItem"], "backdropUrl" | "logo">;
}

/**
 * Layout for the pages of a show's seasons and episodes, which keeps the
 * show's backdrop and logo in view.
 */
export function ShowChildLayout({
  show,
  children,
}: PropsWithChildren<ShowChildLayoutProps>) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      {show.backdropUrl && (
        <BackdropBackground
          image={
            <Image
              alt=""
              className="h-full w-full object-cover starting:opacity-0 opacity-30 blur-3xl transition-opacity duration-1000 ease-[easeOutCubic]"
              src={show.backdropUrl}
              loading="lazy"
              fill
            />
          }
        />
      )}

      <div className="z-10 mx-auto flex h-full w-full max-w-600 flex-col">
        <HeroBanner
          backdropUrl={show.backdropUrl}
          logo={show.logo ?? null}
          trailer={null}
        />
        <div className="px-8 pb-24 md:px-20 lg:px-24">{children}</div>
      </div>
    </div>
  );
}
