import type { DateTime } from "luxon";

export function formatReattemptTime(reattemptDatetime: DateTime) {
  return reattemptDatetime
    .diffNow(["hours", "minutes", "seconds"])
    .rescale()
    .toHuman();
}
