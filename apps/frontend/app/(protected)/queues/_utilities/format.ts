import { DateTime } from "luxon";

export function formatCount(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

/** 0.2 s, 32.4 s, 4 min 12 s, 2 h 5 min. */
export function formatDuration(milliseconds: number) {
  if (milliseconds < 60_000) {
    return `${(Math.round(milliseconds / 100) / 10).toString()} s`;
  }

  const totalSeconds = Math.round(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString()} h ${minutes.toString()} min`;
  }

  return `${minutes.toString()} min ${seconds.toString()} s`;
}

export function formatRelativeTime(iso: string, now: string, locale: string) {
  return DateTime.fromISO(iso).toRelative({
    base: DateTime.fromISO(now),
    locale,
  });
}

/** "26 Nov, 13:49:51" in en-GB, in the local zone. */
export function formatDateTime(iso: string, locale: string) {
  return DateTime.fromISO(iso).setLocale(locale).toFormat("d MMM, HH:mm:ss");
}

/** "13:52" in en-GB, in the local zone. */
export function formatClockTime(iso: string, locale: string) {
  return DateTime.fromISO(iso).setLocale(locale).toFormat("HH:mm");
}
