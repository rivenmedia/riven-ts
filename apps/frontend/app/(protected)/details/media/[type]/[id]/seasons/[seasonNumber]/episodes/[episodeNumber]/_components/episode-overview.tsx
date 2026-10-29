import { cn } from "cn";
import { ChevronRight, Mountain } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { Suspense } from "react";

import { fly } from "#components/_animations/fly.ts";
import { ErrorFallback } from "#components/error-fallback/error-fallback.tsx";

import { ItemActionToolbar } from "../../../../../_components/item-action-toolbar/item-action-toolbar.tsx";
import { formatEpisodeDetails } from "../../../_utilities/format-episode-details.ts";
import { formatSeasonTitle } from "../../../_utilities/format-season-title.ts";
import { EpisodeStateBadge } from "./episode-state-badge.tsx";

import type { GetSeasonQuery } from "../../../_queries/get-season.query.typegen.ts";

type Season = NonNullable<GetSeasonQuery["tmdbItem"]["season"]>;

interface EpisodeOverviewProps {
  show: Pick<GetSeasonQuery["tmdbItem"], "id" | "title">;
  episode: Season["episodes"][number];
}

export function EpisodeOverview({ show, episode }: EpisodeOverviewProps) {
  const seasonNumber = episode.seasonNumber.toString();
  const details = [
    `S${seasonNumber.padStart(2, "0")}E${episode.number.toString().padStart(2, "0")}`,
    ...formatEpisodeDetails(episode),
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr] lg:gap-6">
      <div
        className={cn(
          "bg-muted text-muted-foreground relative hidden aspect-video w-80 items-center justify-center overflow-hidden rounded-xl shadow-2xl lg:flex xl:w-96 delay-50 animation-duration-400",
          fly,
        )}
      >
        {episode.posterUrl ? (
          <Image
            alt=""
            src={episode.posterUrl}
            className="object-cover"
            fill
            sizes="384px"
          />
        ) : (
          <Mountain size={32} strokeWidth={1} />
        )}
      </div>
      <div className="flex flex-col gap-5">
        <nav
          aria-label="Breadcrumb"
          className={cn("delay-75 animation-duration-400", fly)}
        >
          <ol className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm font-medium">
            <li>
              <Link
                href={`/details/media/show/${show.id}`}
                className="hover:text-foreground transition-colors"
              >
                {show.title}
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight size={14} />
            </li>
            <li>
              <Link
                href={`/details/media/show/${show.id}/seasons/${seasonNumber}`}
                className="hover:text-foreground transition-colors"
              >
                {formatSeasonTitle(episode.seasonNumber)}
              </Link>
            </li>
          </ol>
        </nav>
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 delay-100 animation-duration-400",
            fly,
          )}
        >
          <h1 className="text-foreground text-3xl font-black tracking-tight drop-shadow-md sm:text-4xl lg:text-5xl">
            {episode.title}
          </h1>
          <div className="flex flex-col">
            <ErrorFallback message="Failed to load episode state.">
              <Suspense fallback={null}>
                <EpisodeStateBadge
                  className="px-3 py-1.5 text-sm font-medium inline-block h-8"
                  showId={show.id}
                  seasonNumber={episode.seasonNumber}
                  episodeNumber={episode.number}
                  large
                />
              </Suspense>
            </ErrorFallback>
          </div>
        </div>
        <ErrorFallback message="Failed to load item action toolbar.">
          <ItemActionToolbar
            title={episode.title}
            externalId={show.id}
            mediaType="episode"
            episodeNumber={episode.number}
            seasonNumber={episode.seasonNumber}
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
        {episode.overview && (
          <p
            className={cn(
              "text-muted-foreground max-w-4xl text-base leading-relaxed animation-duration-400 delay-250",
              fly,
            )}
          >
            {episode.overview}
          </p>
        )}
      </div>
    </div>
  );
}
