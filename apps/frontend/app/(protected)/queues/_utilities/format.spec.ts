import { Settings } from "luxon";
import { expect, it } from "vitest";

import { FIXTURE_NOW } from "../_fixtures/jobs.fixture.ts";
import {
  formatClockTime,
  formatCount,
  formatDateTime,
  formatDuration,
  formatRelativeTime,
} from "./format.ts";

/** Luxon's default zone, not `process.env.TZ`, because Intl caches the zone. */
function withUtcZone(run: () => void) {
  const originalZone = Settings.defaultZone;

  Settings.defaultZone = "utc";

  try {
    run();
  } finally {
    Settings.defaultZone = originalZone;
  }
}

it("groups thousands in counts", () => {
  expect(formatCount(6930, "en-GB")).toBe("6,930");
});

it.for([
  [200, "0.2 s"],
  [1000, "1.0 s"],
  [32_400, "32.4 s"],
  [59_950, "1 min 0 s"],
  [252_000, "4 min 12 s"],
  [7_500_000, "2 h 5 min"],
] as const)("formats %d ms as %s", ([milliseconds, expected]) => {
  expect(formatDuration(milliseconds)).toBe(expected);
});

it("formats a relative time from the given now", () => {
  expect(
    formatRelativeTime("2026-11-26T13:50:00.000Z", FIXTURE_NOW, "en-GB"),
  ).toBe("12 minutes ago");
});

it("formats an absolute date and time", () => {
  expect.hasAssertions();

  withUtcZone(() => {
    expect(formatDateTime("2026-11-26T13:49:51.000Z", "en-GB")).toBe(
      "26 Nov, 13:49:51",
    );
  });
});

it("formats a clock time", () => {
  expect.hasAssertions();

  withUtcZone(() => {
    expect(formatClockTime("2026-11-26T13:52:30.000Z", "en-GB")).toBe("13:52");
  });
});
