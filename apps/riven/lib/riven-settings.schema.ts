import { json } from "@repo/util-plugin-sdk/validation";

import z from "zod";

import { LogLevel } from "./utilities/logger/log-levels.ts";

export const RivenSettings = z.object({
  databaseUrl: z.url().describe("The database connection URL."),
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
  unsafeClearQueuesOnStartup: z
    .stringbool()
    .default(false)
    .describe(
      "**UNSAFE**.\n \nIf true, all queues will be cleared on application startup.",
    ),
  unsafeRefreshDatabaseOnStartup: z
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
  dubbedAnimeOnly: z
    .stringbool()
    .default(false)
    .describe("Only scrape dubbed anime."),
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
});
