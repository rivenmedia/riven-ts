import { DateTime } from "luxon";

/**
 * Formats the time elapsed since a job was created into a human-readable string.
 *
 * @param timestamp The job's creation timestamp, in milliseconds
 * @returns The elapsed duration, e.g. "1h 5m"
 */
export function formatJobDuration(timestamp: number) {
  return DateTime.fromMillis(timestamp)
    .diffNow(["seconds", "minutes", "hours", "days", "weeks"])
    .rescale()
    .negate()
    .toHuman({
      showZeros: false,
      maximumFractionDigits: 0,
      unitDisplay: "narrow",
    });
}
