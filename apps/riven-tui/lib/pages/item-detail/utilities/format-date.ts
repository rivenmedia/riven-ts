import { DateTime } from "luxon";

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = DateTime.fromISO(value);

  return date.isValid ? date.toFormat("yyyy-LL-dd") : "—";
}
