import { DateTime } from "luxon";
import { expect, it, vi } from "vitest";

import { formatTimestamp } from "./format-timestamp.ts";

const now = DateTime.fromISO("2026-11-20T12:00:00Z");

it.beforeEach(() => {
  vi.useFakeTimers({ now: now.toJSDate() });

  return () => {
    vi.useRealTimers();
  };
});

it.for([0, 59])(
  "describes a notification from %i seconds ago as just now",
  (seconds) => {
    expect(formatTimestamp(now.minus({ seconds }).toISO())).toBe("Just now");
  },
);

it.for([
  [{ seconds: 60 }, "1 minute ago"],
  [{ hours: 3 }, "3 hours ago"],
  [{ days: 6, hours: 23 }, "6 days ago"],
] as const)(
  "describes a notification from %o ago relatively",
  ([duration, expected]) => {
    expect(formatTimestamp(now.minus(duration).toISO())).toBe(expected);
  },
);

it("shows the date and time of a notification from a week or more ago", () => {
  const timestamp = now.minus({ days: 7 });

  expect(formatTimestamp(timestamp.toISO())).toBe(
    timestamp.toLocaleString(DateTime.DATETIME_MED),
  );
  expect(formatTimestamp(timestamp.toISO())).not.toMatch(/ago$/u);
});
