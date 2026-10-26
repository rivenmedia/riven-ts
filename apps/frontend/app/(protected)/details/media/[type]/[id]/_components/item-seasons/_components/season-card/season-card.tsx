import { StatusBadge } from "#components/media/status-badge/status-badge.tsx";
import { PortraitCard } from "#components/portrait-card/portrait-card.tsx";

import type { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

export interface SeasonState {
  isRequested: boolean;
  state: MediaItemState;
  completedEpisodeCount: number;
}

export interface SeasonCardProps {
  title: string;
  posterUrl: string | null;
  episodeCount: number;
  /**
   * The state of the season's media item, if the season has been indexed.
   */
  season?: SeasonState | undefined;
  isLive?: boolean;
}

/**
 * Season poster with its state badge and completed episode progress,
 * or an "Unrequested" badge if the season hasn't been indexed.
 */
export function SeasonCard({
  title,
  posterUrl,
  episodeCount,
  season,
  isLive = false,
}: SeasonCardProps) {
  return (
    <>
      <PortraitCard
        title={title}
        image={posterUrl}
        className="w-28 md:w-32 lg:w-36"
        topRight={
          season ? (
            <StatusBadge
              isRequested={season.isRequested}
              state={season.state}
              isLive={isLive}
            />
          ) : (
            <StatusBadge isRequested={false} />
          )
        }
      />
      {season && episodeCount > 0 && (
        <div className="mt-1.5 flex items-center gap-1.5 px-0.5">
          <div className="bg-muted h-1 flex-1 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  (season.completedEpisodeCount / episodeCount) * 100,
                ).toString()}%`,
              }}
            />
          </div>
          <span className="text-muted-foreground font-mono text-[10px]">
            {season.completedEpisodeCount}/{episodeCount}
          </span>
        </div>
      )}
    </>
  );
}
