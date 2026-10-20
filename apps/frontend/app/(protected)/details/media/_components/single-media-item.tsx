import Image from "next/image";

import { BackdropBackground } from "#components/media/backdrop-background/backdrop-background.tsx";
import { HeroBanner } from "#components/media/hero-banner/hero-banner.tsx";

import { ItemOverview } from "../[type]/[id]/_components/item-overview";

import type { ComponentProps, ReactNode } from "react";

interface SingleMediaItemProps {
  indexerData: ComponentProps<typeof ItemOverview>["data"];
  slots: {
    seasonList?: ReactNode;
    castList?: ReactNode;
    itemMetadata?: ReactNode;
    itemRecommendations?: ReactNode;
    similarItems?: ReactNode;
  };
}

export function SingleMediaItem({ indexerData, slots }: SingleMediaItemProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      {indexerData.backdropUrl && (
        <BackdropBackground
          image={
            <Image
              alt=""
              className="h-full w-full object-cover starting:opacity-0 opacity-30 blur-3xl transition-opacity duration-1000 ease-[easeOutCubic]"
              src={indexerData.backdropUrl}
              loading="lazy"
              fill
            />
          }
        />
      )}

      <div className="z-10 mx-auto flex h-full w-full max-w-600 flex-col">
        <HeroBanner
          backdropUrl={indexerData.backdropUrl}
          logo={indexerData.logo ?? null}
          trailer={indexerData.trailer}
        />
        <div className="px-8 pb-24 md:px-20 lg:px-24">
          <ItemOverview data={indexerData} />
          {slots.seasonList}
          {slots.castList}
          {slots.itemMetadata}
          {slots.itemRecommendations}
          {slots.similarItems}
        </div>
      </div>
    </div>
  );
}
