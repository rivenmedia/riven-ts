import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ShowChildSkeleton } from "./_components/show-child-skeleton.tsx";
import { fetchSeason } from "./_data-access/fetch-season.ts";
import { parseNumberParam } from "./_utilities/parse-number-param.ts";
import { SeasonDetailsPage as SeasonDetailsPageClient } from "./page.client.tsx";

async function SeasonDetails({
  params,
}: Pick<
  PageProps<"/details/media/[type]/[id]/seasons/[seasonNumber]">,
  "params"
>) {
  const { id, type, seasonNumber } = await params;
  const parsedSeasonNumber = parseNumberParam(seasonNumber);

  if (type !== "show" || parsedSeasonNumber === null) {
    return notFound();
  }

  const data = await fetchSeason(id, parsedSeasonNumber);

  if (!data?.season) {
    return notFound();
  }

  const { season, ...show } = data;

  return <SeasonDetailsPageClient show={show} season={season} />;
}

export default function SeasonDetailsPage({
  params,
}: PageProps<"/details/media/[type]/[id]/seasons/[seasonNumber]">) {
  return (
    <Suspense fallback={<ShowChildSkeleton />}>
      <SeasonDetails params={params} />
    </Suspense>
  );
}
