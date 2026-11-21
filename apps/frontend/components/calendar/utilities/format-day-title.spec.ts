import { DateTime } from "luxon";
import { expect, it } from "vitest";

import { formatDayTitle } from "./format-day-title.ts";

it("formats a calendar day title", () => {
  expect(formatDayTitle(DateTime.local(2026, 11, 20))).toBe("Fri, November 20");
});
