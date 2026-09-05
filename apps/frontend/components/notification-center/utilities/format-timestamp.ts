import { DateTime } from "luxon";

export function formatTimestamp(timestamp: string): string {
  const datetime = DateTime.fromISO(timestamp);
  const durationSinceNotification = datetime.diffNow().negate();

  if (durationSinceNotification.as("seconds") < 60) {
    return "Just now";
  }

  if (durationSinceNotification.as("days") < 7) {
    return datetime.toRelative();
  }

  return datetime.toLocaleString(DateTime.DATETIME_MED);
}
