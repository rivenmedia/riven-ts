import { DateTime } from "luxon";

interface FormatEpisodeDetailsOptions {
  airDate?: string | null | undefined;
  runtime?: number | null | undefined;
}

/**
 * Formats an episode's air date and runtime for display, e.g. `["Jan 20, 2008", "58m"]`.
 *
 * @param airDate The ISO air date of the episode. Air dates are calendar dates, so are formatted in UTC.
 * @param runtime The runtime of the episode in minutes
 */
export function formatEpisodeDetails({
  airDate,
  runtime,
}: FormatEpisodeDetailsOptions) {
  const details: string[] = [];

  if (airDate) {
    details.push(
      DateTime.fromISO(airDate, { zone: "utc" }).toLocaleString(
        DateTime.DATE_MED,
      ),
    );
  }

  if (runtime) {
    details.push(`${runtime.toString()}m`);
  }

  return details;
}
