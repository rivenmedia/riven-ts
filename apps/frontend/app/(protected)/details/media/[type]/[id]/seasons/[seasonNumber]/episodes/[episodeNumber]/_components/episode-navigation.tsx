import { cn } from "cn";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { fly } from "#components/_animations/fly.ts";
import { Button } from "#components/_ui/button.tsx";

import type { GetSeasonQuery } from "../../../_queries/get-season.query.typegen";

type Episode = NonNullable<
  GetSeasonQuery["tmdbItem"]["season"]
>["episodes"][number];

interface EpisodeNavigationProps {
  showId: string;
  previousEpisode: Pick<Episode, "number" | "seasonNumber" | "title"> | null;
  nextEpisode: Pick<Episode, "number" | "seasonNumber" | "title"> | null;
}

/**
 * Links to the previous and next episodes of the season.
 */
export function EpisodeNavigation({
  showId,
  previousEpisode,
  nextEpisode,
}: EpisodeNavigationProps) {
  if (!previousEpisode && !nextEpisode) {
    return null;
  }

  function getHref(episode: Pick<Episode, "number" | "seasonNumber">) {
    return `/details/media/show/${showId}/seasons/${episode.seasonNumber.toString()}/episodes/${episode.number.toString()}` as const;
  }

  return (
    <nav
      aria-label="Episodes"
      className={cn(
        "mt-8 flex flex-wrap justify-between gap-3 md:mt-12 animation-duration-400 delay-400",
        fly,
      )}
    >
      {previousEpisode ? (
        <Button asChild variant="outline" size="lg">
          <Link href={getHref(previousEpisode)} rel="prev">
            <ChevronLeft data-icon="inline-start" />
            <span className="truncate">
              {previousEpisode.number}. {previousEpisode.title}
            </span>
          </Link>
        </Button>
      ) : (
        <span />
      )}
      {nextEpisode && (
        <Button asChild variant="outline" size="lg">
          <Link href={getHref(nextEpisode)} rel="next">
            <span className="truncate">
              {nextEpisode.number}. {nextEpisode.title}
            </span>
            <ChevronRight data-icon="inline-end" />
          </Link>
        </Button>
      )}
    </nav>
  );
}
