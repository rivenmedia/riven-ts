import { type } from "arktype";

import { LogLevel } from "./utilities/logger/log-levels.ts";

export const RivenSettings = type({
  databaseUrl: type("string.url").describe("The database connection URL."),
  redisUrl: type("string.url").describe("The Redis server URL."),
  vfsDebugLogging: type("boolean | 'true' | 'false'")
    .describe("Enable debug logging for the virtual file system.")
    .default(false),
  vfsMountPath: type("string").describe(
    "The mount point for the virtual file system.",
  ),
  vfsForceMount: type("boolean | 'true' | 'false'")
    .describe("If true, attempts to unmount the mount-point before remounting.")
    .default(true),
  unsafeClearQueuesOnStartup: type("boolean | 'true' | 'false'")
    .describe(
      "**UNSAFE**.\n \nIf true, all queues will be cleared on application startup.",
    )
    .default(false),
  unsafeRefreshDatabaseOnStartup: type("boolean | 'true' | 'false'")
    .describe(
      "**UNSAFE**.\n \nIf true, the database will be wiped on application startup.",
    )
    .default(false),
  enabledLogTransports: type
    .enumerated("console", "file")
    .array()
    .describe("The enabled logging transports.")
    .default(() => ["console", "file"]),
  loggingEnabled: type('boolean | "true" | "false"')
    .describe("Enable or disable logging for the application.")
    .default(true),
  logLevel: LogLevel.describe("The logging level for the application.").default(
    "info",
  ),
  logDirectory: type("string")
    .describe("The directory where log files will be stored.")
    .default("./logs"),
  logShowStackTraces: type('boolean | "true" | "false"')
    .describe("Whether to show detailed stack traces when logging errors")
    .default(true),
  gqlPort: type("number.integer | string.integer.parse")
    .describe("The GraphQL server port.")
    .default(3000),
  dubbedAnimeOnly: type('boolean | "true" | "false"')
    .describe("Only scrape dubbed anime.")
    .default(false),
  "minimumAverageBitrateMovies?": type("number.integer | string.integer.parse")
    .pipe((number) => number > 0)
    .describe("The minimum average bitrate for movies."),
  "minimumAverageBitrateEpisodes?": type(
    "number.integer | string.integer.parse",
  )
    .pipe((number) => number > 0)
    .describe("The minimum average bitrate for episodes."),
  scheduleOffsetMinutes: type("number.integer | string.integer.parse")
    .pipe((number) => number >= 0)
    .describe(
      "The number of minutes to wait after an item's air date before attempting to re-index it.",
    )
    .default(30),
  unknownAirDateOffsetDays: type("number.integer | string.integer.parse")
    .pipe((number) => number >= 0)
    .describe(
      "When an episode has no air date, this number of days will be added to the current date to estimate a release date for scheduling purposes.",
    )
    .default(7),
});
