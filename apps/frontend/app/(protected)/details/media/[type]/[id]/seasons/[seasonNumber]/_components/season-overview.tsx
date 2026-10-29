import { cn } from "cn";
import { ChevronLeft } from "lucide-react";
import { DateTime } from "luxon";
import Link from "next/link";
import React, { Suspense } from "react";

import { fly } from "#components/_animations/fly.ts";
import { ErrorFallback } from "#components/error-fallback/error-fallback.tsx";
import { PortraitCard } from "#components/portrait-card/portrait-card.tsx";

import { ItemActionToolbar } from "../../../_components/item-action-toolbar/item-action-toolbar.tsx";
import { formatSeasonTitle } from "../_utilities/format-season-title.ts";
import { SeasonStateBadge } from "./season-state-badge.tsx";

import type { GetSeasonQuery } from "../_queries/get-season.query.typegen.ts";

type Show = GetSeasonQuery["tmdbItem"];

interface SeasonOverviewProps {
  show: Pick<Show, "id" | "title">;
  season: NonNullable<Show["season"]>;
}

export function SeasonOverview({ show, season }: SeasonOverviewProps) {
  const title = formatSeasonTitle(season.number);
  const firstAirDate = season.episodes.find(({ airDate }) => airDate)?.airDate;
  const details = [
    `${season.episodes.length.toString()} ${season.episodes.length === 1 ? "episode" : "episodes"}`,
    firstAirDate && DateTime.fromISO(firstAirDate, { zone: "utc" }).year,
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
          title={title}
          image={season.posterUrl}
          className="group w-48 rounded-xl shadow-2xl lg:w-64"
          showContent={false}
        />
      </div>
      <div className="flex flex-col gap-5">
        <Link
          href={`/details/media/show/${show.id}`}
          className={cn(
            "text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-sm font-medium transition-colors delay-75 animation-duration-400",
            fly,
          )}
        >
          <ChevronLeft size={16} />
          {show.title}
        </Link>
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 delay-100 animation-duration-400",
            fly,
          )}
        >
          <h1 className="text-foreground text-3xl font-black tracking-tight drop-shadow-md sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <ErrorFallback message="Failed to load season state.">
            <Suspense fallback={null}>
              <SeasonStateBadge
                className="px-3 py-1.5 text-sm font-medium inline-block h-8"
                showId={show.id}
                seasonNumber={season.number}
                large
              />
            </Suspense>
          </ErrorFallback>
        </div>
        <ErrorFallback message="Failed to load item action toolbar.">
          <Suspense fallback={null}>
            <ItemActionToolbar
              externalId={show.id}
              mediaType="season"
              title={season.title}
              seasonNumber={season.number}
            />
          </Suspense>
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
        {season.overview && (
          <p
            className={cn(
              "text-muted-foreground max-w-4xl text-base leading-relaxed animation-duration-400 delay-250",
              fly,
            )}
          >
            {season.overview}
          </p>
        )}
      </div>
    </div>
  );
}
