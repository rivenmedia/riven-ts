import { expect, it } from "vitest";

import { RuntimeSettings } from "./core-settings-sections.ts";
import { GeneralSettings } from "./sections/general-settings.schema.ts";
import { getLeafPaths } from "./utilities/leaf-paths.ts";

it("has no duplicate leaf keys across all core sections", () => {
  expect(() => getLeafPaths(RuntimeSettings)).not.toThrow();
});

it("defaults the general settings to the previous core defaults", () => {
  const general = GeneralSettings.parse({
    scraping: {},
    scheduling: {},
    logging: {},
  });

  expect(general).toStrictEqual({
    scraping: {
      attemptUnknownDownloads: false,
      dubbedAnimeOnly: false,
      maximumFailedAttempts: 10,
      preferSeasonPacks: false,
      scrapeCooldownHours: [2, 6, 24],
    },
    scheduling: {
      scheduleOffsetMinutes: 30,
      unknownAirDateOffsetDays: 7,
      retryLibraryIntervalSeconds: 86_400,
    },
    logging: {
      loggingEnabled: true,
      logLevel: "info",
      logDirectory: "./logs",
      enabledLogTransports: ["console", "file"],
      logShowStackTraces: true,
    },
  });
});

it("treats 0 maximum failed attempts as unlimited", () => {
  const general = GeneralSettings.parse({
    scraping: { maximumFailedAttempts: 0 },
    scheduling: {},
    logging: {},
  });

  expect(general.scraping.maximumFailedAttempts).toBe(Number.MAX_SAFE_INTEGER);
});
