import { cacheLife } from "next/cache";

import { CastSection } from "#app/(protected)/details/media/_components/cast-section.tsx";
import { query } from "#lib/graphql/client.ts";

import { GET_EPISODE_CAST } from "../_queries/get-episode-cast.query.ts";

async function fetchEpisodeCast(
  showId: string,
  seasonNumber: number,
  episodeNumber: number,
  locale: string,
) {
  "use cache";

  cacheLife("days");

  const { data, error } = await query({
    query: GET_EPISODE_CAST,
    variables: { id: showId, seasonNumber, episodeNumber, language: locale },
  });

  if (error) {
    throw error;
  }

  return data?.tmdbItem.season?.episode?.cast ?? null;
}

interface EpisodeCastProps {
  showId: string;
  seasonNumber: number;
  episodeNumber: number;
}

export function EpisodeCast({
  showId,
  seasonNumber,
  episodeNumber,
}: EpisodeCastProps) {
  return (
    <CastSection
      className="delay-350"
      fetchCast={async (locale) =>
        fetchEpisodeCast(showId, seasonNumber, episodeNumber, locale)
      }
    />
  );
}
