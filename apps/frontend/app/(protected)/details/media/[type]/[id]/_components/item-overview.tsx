import { cn } from "cn";
import { startCase } from "es-toolkit";
import React from "react";

import { fly } from "#components/_animations/fly.ts";
import { ErrorFallback } from "#components/error-fallback/error-fallback.tsx";
import { ItemStateBadge } from "#components/item-state-badge/item-state-badge.tsx";
import { RatingsRow } from "#components/media/ratings-row/ratings-row.tsx";
import { PortraitCard } from "#components/portrait-card/portrait-card.tsx";

import { ItemActionToolbar } from "./item-action-toolbar/item-action-toolbar";

import type {
  IndexerData,
  MediaItem,
} from "#app/_types/__generated__/graphql.ts";

interface ItemOverviewProps {
  data: Omit<IndexerData, "mediaItem"> & {
    mediaItem?: Pick<MediaItem, "id" | "isRequested" | "state"> | null;
  };
}

export function ItemOverview({ data }: ItemOverviewProps) {
  const details = [
    data.year,
    data.runtime,
    data.language?.toUpperCase(),
    data.certification,
    startCase(data.status),
  ].filter(Boolean);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr] lg:gap-6">
      <div
        className={cn(
          "hidden lg:mx-0 lg:block delay-50 animation-duration-400",
          fly,
        )}
      >
        <PortraitCard
          title={data.title}
          image={data.posterUrl}
          className="group w-48 rounded-xl shadow-2xl lg:w-64"
          showContent={false}
        />
      </div>
      <div className="flex flex-col gap-5">
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 delay-100 animation-duration-400",
            fly,
          )}
        >
          <h1 className="text-foreground text-3xl font-black tracking-tight drop-shadow-md sm:text-4xl lg:text-5xl">
            {data.title}
          </h1>
          {data.mediaItem && (
            <ItemStateBadge
              className="px-3 py-1.5 text-sm font-medium inline-block h-8"
              id={data.mediaItem.id}
              large
            />
          )}
        </div>
        <ErrorFallback message="Failed to load item action toolbar.">
          <ItemActionToolbar
            title={data.title}
            externalId={data.id}
            mediaType={data.type}
          />
        </ErrorFallback>
        <div
          className={cn(
            "text-muted-foreground flex items-center gap-x-2.5 text-sm animation-duration-400 delay-200",
            fly,
          )}
        >
          {details.map((detail, i) => (
            <React.Fragment key={detail}>
              <span>{detail}</span>
              {i < details.length - 1 && <span className="text-border">•</span>}
            </React.Fragment>
          ))}
        </div>
        {data.genres.length > 0 && (
          <div
            className={cn(
              "flex flex-wrap items-center gap-2 animation-duration-400 delay-250",
              fly,
            )}
          >
            {data.genres.map((genre) => (
              <span
                key={genre.id}
                className="border-border bg-muted/50 text-muted-foreground rounded-xl border px-3 py-1 text-sm"
              >
                {genre.name}
              </span>
            ))}
          </div>
        )}
        <RatingsRow
          scores={[
            {
              name: "IMDb",
              image: "imdb.svg",
              score: "7.6",
              url: "",
            },
            {
              name: "TMDb",
              image: "tmdb.svg",
              score: "9.2",
              url: "",
            },
          ]}
          loading={false}
        />
        <p
          className={cn(
            "text-muted-foreground max-w-4xl text-base leading-relaxed animation-duration-400 delay-350",
            fly,
          )}
        >
          {data.overview}
        </p>
      </div>
    </div>
  );
}
