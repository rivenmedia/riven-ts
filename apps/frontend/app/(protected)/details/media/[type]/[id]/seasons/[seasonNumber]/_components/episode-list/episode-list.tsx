import { EpisodeCard } from "../episode-card/episode-card.tsx";

import type {
  EpisodeCardProps,
  EpisodeState,
} from "../episode-card/episode-card.tsx";

export interface EpisodeListProps {
  showId: string;
  seasonNumber: number;
  episodes: (EpisodeCardProps["episode"] & { id: string })[];
  /**
   * The states of the indexed episodes, keyed by episode number.
   */
  episodeStates: Map<number, EpisodeState>;
}

/**
 * List of a season's episodes, each linking to its episode details page.
 */
export function EpisodeList({
  showId,
  seasonNumber,
  episodes,
  episodeStates,
}: EpisodeListProps) {
  if (episodes.length === 0) {
    return <p className="text-muted-foreground">No episodes found.</p>;
  }

  return (
    <ol className="flex flex-col gap-2">
      {episodes.map((episode) => (
        <li key={episode.id}>
          <EpisodeCard
            episode={episode}
            href={`/details/media/show/${showId}/seasons/${seasonNumber.toString()}/episodes/${episode.number.toString()}`}
            state={episodeStates.get(episode.number)}
          />
        </li>
      ))}
    </ol>
  );
}
