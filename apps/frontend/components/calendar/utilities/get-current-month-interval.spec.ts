import { DateTime } from "luxon";
import { expect, it } from "vitest";

import { formatDayTitle } from "./format-day-title.ts";
import { getCurrentMonthInterval } from "./get-current-month-interval.ts";

it("spans whole weeks from before the start of the month to after its end", () => {
  // November 2026 starts on a Sunday and ends on a Monday
  const interval = getCurrentMonthInterval(DateTime.local(2026, 11, 15));

  expect(interval.start.toISODate()).toBe("2026-10-26");
  expect(interval.end.toISODate()).toBe("2026-12-06");
  expect(interval.count("days")).toBe(42);
});

it("ends with the month when the month ends on the last day of the week", () => {
  // May 2026 starts on a Friday and ends on a Sunday
  const interval = getCurrentMonthInterval(DateTime.local(2026, 5, 1));

  expect(interval.start.toISODate()).toBe("2026-04-27");
  expect(interval.end.toISODate()).toBe("2026-05-31");
});

it("formats a calendar day title", () => {
  expect(formatDayTitle(DateTime.local(2026, 11, 20))).toBe("Fri, November 20");
});
