import { DateTime } from "@repo/util-plugin-sdk/helpers/dates";

/**
 * Parses a TMDB date string (e.g. `2008-01-20`).
 *
 * TMDB returns an empty string for unaired shows, so empty dates resolve to `null`.
 */
export function parseTmdbDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return DateTime.fromISO(value).toJSDate();
}
