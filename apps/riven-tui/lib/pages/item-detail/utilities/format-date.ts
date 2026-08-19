import { DateTime } from "luxon";

import type { DateTimeFormatOptions } from "luxon";

export function formatDate(
  value: string | null | undefined,
  format: DateTimeFormatOptions = DateTime.DATE_SHORT,
): string {
  if (!value) {
    return "—";
  }

  const date = DateTime.fromISO(value);

  return date.isValid ? date.toLocaleString(format) : "—";
}
