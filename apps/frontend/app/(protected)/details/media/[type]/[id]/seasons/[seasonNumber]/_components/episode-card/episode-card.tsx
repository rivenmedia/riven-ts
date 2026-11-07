import { Mountain } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { StatusBadge } from "#components/media/status-badge/status-badge.tsx";

import { formatEpisodeDetails } from "../../_utilities/format-episode-details.ts";

import type { IndexerEpisode } from "#app/_types/__generated__/graphql.ts";
import type { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import type { LinkProps } from "next/link";

export interface EpisodeState {
  isRequested: boolean;
  state: MediaItemState;
}

export interface EpisodeCardProps {
  episode: Pick<
    IndexerEpisode,
    "number" | "title" | "overview" | "airDate" | "runtime" | "posterUrl"
  >;
  href: LinkProps<`/details/media/show/${string}`>["href"];
  /**
   * The state of the episode's media item, if the episode has been indexed.
   */
  state?: EpisodeState | undefined;
}

/**
 * Episode row with its still, number, title, air date, runtime and overview,
 * linking to the episode's details page.
 */
export function EpisodeCard({ episode, href, state }: EpisodeCardProps) {
  const details = formatEpisodeDetails(episode);

  return (
    <Link
      href={href}
      className="group hover:bg-muted/40 focus-visible:ring-primary flex gap-4 rounded-xl p-2 outline-none transition-colors focus-visible:ring-2 md:gap-6"
    >
      <div className="bg-muted text-muted-foreground relative flex aspect-video w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg sm:w-44 md:w-56">
        {episode.posterUrl ? (
          <Image
            alt=""
            src={episode.posterUrl}
            loading="lazy"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            fill
            sizes="(max-width: 640px) 128px, (max-width: 768px) 176px, 224px"
          />
        ) : (
          <Mountain size={24} strokeWidth={1} />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-1.5 py-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="text-foreground font-semibold leading-tight">
            <span className="text-muted-foreground mr-2 font-mono text-sm">
              {episode.number}.
            </span>
            {episode.title}
          </h3>
          {state ? (
            <StatusBadge isRequested={state.isRequested} state={state.state} />
          ) : (
            <StatusBadge isRequested={false} />
          )}
        </div>
        {details.length > 0 && (
          <p className="text-muted-foreground text-xs">{details.join(" • ")}</p>
        )}
        {episode.overview && (
          <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
            {episode.overview}
          </p>
        )}
      </div>
    </Link>
  );
}
