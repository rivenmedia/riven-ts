import type { DateTime } from "luxon";

export function formatDayTitle(date: DateTime) {
  return date.toFormat("ccc, LLLL d");
}
