import { ProcessingLabel } from "#app/(protected)/details/media/_components/processing-label/processing-label.tsx";

import { fetchSeasonState } from "../_data-access/fetch-season-state.ts";

interface SeasonProcessingLabelProps {
  showId: string;
  seasonNumber: number;
}

/**
 * Label shown while a season is being processed, once the season has been indexed.
 */
export async function SeasonProcessingLabel({
  showId,
  seasonNumber,
}: SeasonProcessingLabelProps) {
  const season = await fetchSeasonState(showId, seasonNumber);

  if (!season) {
    return null;
  }

  return <ProcessingLabel id={season.id} />;
}
