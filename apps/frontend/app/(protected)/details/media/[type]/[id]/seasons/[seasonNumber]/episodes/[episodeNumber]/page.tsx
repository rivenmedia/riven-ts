import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ShowChildSkeleton } from "../../_components/show-child-skeleton.tsx";
import { fetchSeason } from "../../_data-access/fetch-season.ts";
import { parseNumberParam } from "../../_utilities/parse-number-param.ts";
import { EpisodeDetailsPage as EpisodeDetailsPageClient } from "./page.client.tsx";

async function EpisodeDetails({
  params,
}: Pick<
  PageProps<"/details/media/[type]/[id]/seasons/[seasonNumber]/episodes/[episodeNumber]">,
  "params"
>) {
  const { id, type, seasonNumber, episodeNumber } = await params;
  const parsedSeasonNumber = parseNumberParam(seasonNumber);
  const parsedEpisodeNumber = parseNumberParam(episodeNumber);

  if (
    type !== "show" ||
    parsedSeasonNumber === null ||
    parsedEpisodeNumber === null
  ) {
    return notFound();
  }

  const data = await fetchSeason(id, parsedSeasonNumber);
  const episodes = data?.season?.episodes ?? [];
  const episodeIndex = episodes.findIndex(
    ({ number }) => number === parsedEpisodeNumber,
  );
  const episode = episodes[episodeIndex];

  if (!data || !episode) {
    return notFound();
  }

  const { season: _season, ...show } = data;

  return (
    <EpisodeDetailsPageClient
      show={show}
      episode={episode}
      previousEpisode={episodes[episodeIndex - 1] ?? null}
      nextEpisode={episodes[episodeIndex + 1] ?? null}
    />
  );
}

export default function EpisodeDetailsPage({
  params,
}: PageProps<"/details/media/[type]/[id]/seasons/[seasonNumber]/episodes/[episodeNumber]">) {
  return (
    <Suspense fallback={<ShowChildSkeleton />}>
      <EpisodeDetails params={params} />
    </Suspense>
  );
}
