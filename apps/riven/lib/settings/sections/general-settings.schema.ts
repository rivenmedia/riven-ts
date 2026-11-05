import { LogLevel } from "@repo/util-plugin-sdk/dto/enums/log-level.enum";

import dedent from "dedent";
import { Duration } from "luxon";
import z from "zod";

export const GeneralSettings = z
  .object({
    scraping: z
      .object({
        attemptUnknownDownloads: z
          .boolean()
          .default(false)
          .describe(
            dedent`
              If true, Riven will attempt to download torrents whose contents cannot be verified without first attempting to download.

              **Note**: Enabling this will degrade performance as more download attempts will be made for all items,
              however it may be useful to enable if Riven's plugins are unable to find your requested items.
            `,
          ),
        dubbedAnimeOnly: z
          .boolean()
          .default(false)
          .describe("Only scrape dubbed anime."),
        maximumFailedAttempts: z
          .int()
          .nonnegative()
          .max(10)
          .default(10)
          .transform((val) => (val === 0 ? Number.MAX_SAFE_INTEGER : val))
          .describe(
            "The maximum number of scrape attempts before giving up on an item. Set to 0 to allow unlimited attempts (not recommended).",
          ),
        minimumAverageBitrateMovies: z
          .int()
          .positive()
          .optional()
          .describe("The minimum average bitrate for movies in kbps."),
        maximumAverageBitrateMovies: z
          .int()
          .positive()
          .optional()
          .describe("The maximum average bitrate for movies in kbps."),
        minimumAverageBitrateEpisodes: z
          .int()
          .positive()
          .optional()
          .describe("The minimum average bitrate for episodes in kbps."),
        maximumAverageBitrateEpisodes: z
          .int()
          .positive()
          .optional()
          .describe("The maximum average bitrate for episodes in kbps."),
        preferSeasonPacks: z
          .boolean()
          .default(false)
          .describe(
            "If true, Riven will prefer to download season packs over show packs.",
          ),
        scrapeCooldownHours: z
          .tuple([
            z.int().nonnegative().default(2),
            z.int().nonnegative().default(6),
            z.int().nonnegative().default(24),
          ])
          .default([2, 6, 24])
          .describe(
            dedent`
              The cooldown periods (in hours) to apply after failed scrape attempts,
              in the format [> 2 attempts, > 5 attempts, > 10 attempts].
            `,
          ),
      })
      .meta({ title: "Scraping" }),
    scheduling: z
      .object({
        scheduleOffsetMinutes: z
          .int()
          .nonnegative()
          .default(30)
          .describe(
            "The number of minutes to wait after an item's air date before attempting to re-index it.",
          ),
        unknownAirDateOffsetDays: z
          .int()
          .nonnegative()
          .default(7)
          .describe(
            "When an episode has no air date, this number of days will be added to the current date to estimate a release date for scheduling purposes.",
          ),
        retryLibraryIntervalSeconds: z
          .int()
          .nonnegative()
          .default(Duration.fromObject({ days: 1 }).as("seconds"))
          .describe(
            "The interval in seconds for retrying the library. Set to 0 to disable.",
          ),
      })
      .meta({ title: "Scheduling" }),
    logging: z
      .object({
        loggingEnabled: z
          .boolean()
          .default(true)
          .describe("Enable or disable logging for the application."),
        logLevel: LogLevel.default("info").describe(
          "The logging level for the application.",
        ),
        logDirectory: z
          .string()
          .default("./logs")
          .describe("The directory where log files will be stored."),
        enabledLogTransports: z
          .array(z.enum(["console", "file"]))
          .default(["console", "file"])
          .describe("The enabled logging transports."),
        logShowStackTraces: z
          .boolean()
          .default(true)
          .describe(
            "Whether to show detailed stack traces when unexpected errors occur.",
          ),
      })
      .meta({ title: "Logging" }),
  })
  .meta({ title: "General" });

export type GeneralSettings = z.infer<typeof GeneralSettings>;
