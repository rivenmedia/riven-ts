import { json } from "@repo/util-plugin-sdk/validation";

import dedent from "dedent";
import { readFileSync } from "node:fs";
import z from "zod";

import { CorePlugins } from "./schemas/core-plugins.schema.ts";
import { LogLevel } from "./utilities/logger/log-levels.ts";

export const RivenSettings = z.object({
  attemptUnknownDownloads: z
    .stringbool()
    .default(false)
    .describe(
      dedent`
        If true, Riven will attempt to download torrents whose contents cannot be verified without first attempting to download.

        **Note**: Enabling this will degrade performance as more download attempts will be made for all items,
        however it may be useful to enable if Riven's plugins are unable to find your requested items.
      `,
    ),
  databaseUrl: z.url().describe("The database connection URL."),
  databaseDebugLogging: z
    .stringbool()
    .default(false)
    .describe("Enable debug logging for the database."),
  databaseSslRootCert: z
    .string()
    .transform((val) => readFileSync(val, "utf8"))
    .optional()
    .describe(
      "The file path to the SSL root certificate for the database connection.",
    ),
  databaseSslCert: z
    .string()
    .transform((val) => readFileSync(val, "utf8"))
    .optional()
    .describe(
      "The file path to the SSL certificate for the database connection.",
    ),
  databaseSslKey: z
    .string()
    .transform((val) => readFileSync(val, "utf8"))
    .optional()
    .describe("The file path to the SSL key for the database connection."),
  redisUrl: z.url().describe("The Redis server URL."),
  vfsDebugLogging: z
    .stringbool()
    .default(false)
    .describe("Enable debug logging for the virtual file system."),
  vfsMountPath: z
    .string()
    .describe("The mount point for the virtual file system."),
  vfsForceMount: z
    .stringbool()
    .default(true)
    .describe(
      "If true, attempts to unmount the mount-point before remounting.",
    ),
  unsafeWipeRedisOnStartup: z
    .stringbool()
    .default(false)
    .describe(
      "**UNSAFE**.\n \nIf true, all Redis data will be removed on application startup.",
    ),
  unsafeWipeDatabaseOnStartup: z
    .stringbool()
    .default(false)
    .describe(
      "**UNSAFE**.\n \nIf true, the database will be wiped on application startup.",
    ),
  enabledLogTransports: json(z.array(z.enum(["console", "file"])))
    .default(["console", "file"])
    .describe("The enabled logging transports."),
  loggingEnabled: z
    .stringbool()
    .default(true)
    .describe("Enable or disable logging for the application."),
  logLevel: LogLevel.default("info").describe(
    "The logging level for the application.",
  ),
  logDirectory: z
    .string()
    .default("./logs")
    .describe("The directory where log files will be stored."),
  logShowStackTraces: z
    .stringbool()
    .default(true)
    .describe("Whether to show detailed stack traces when logging errors"),
  gqlPort: z.coerce
    .number()
    .int()
    .default(3000)
    .describe("The GraphQL server port."),
  dubbedAnimeOnly: z
    .stringbool()
    .default(false)
    .describe("Only scrape dubbed anime."),
  maximumScrapeAttempts: z
    .int()
    .nonnegative()
    .default(Number.MAX_SAFE_INTEGER)
    .describe(
      "The maximum number of scrape attempts before giving up on an item.",
    ),
  minimumAverageBitrateMovies: z
    .int()
    .positive()
    .optional()
    .describe("The minimum average bitrate for movies."),
  minimumAverageBitrateEpisodes: z
    .int()
    .positive()
    .optional()
    .describe("The minimum average bitrate for episodes."),
  preferSeasonPacks: z
    .stringbool()
    .default(false)
    .describe(
      "If true, Riven will prefer to download season packs over show packs.",
    ),
  scheduleOffsetMinutes: z
    .int()
    .nonnegative()
    .default(30)
    .describe(
      "The number of minutes to wait after an item's air date before attempting to re-index it.",
    ),
  scrapeCooldownHours: json(
    z.tuple([
      z.int().nonnegative().default(2),
      z.int().nonnegative().default(6),
      z.int().nonnegative().default(24),
    ]),
  ).default([2, 6, 24]).describe(dedent`
      The cooldown periods (in hours) to apply after failed scrape attempts,
      in the format [> 2 attempts, > 5 attempts, > 10 attempts].
    `),
  unknownAirDateOffsetDays: z
    .int()
    .nonnegative()
    .default(7)
    .describe(
      "When an episode has no air date, this number of days will be added to the current date to estimate a release date for scheduling purposes.",
    ),
  enabledPlugins: json(z.array(CorePlugins))
    .default([])
    .describe("A list of core plugins to enable."),
});

export type RivenSettings = z.infer<typeof RivenSettings>;
