// oxlint-disable node/no-sync

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
    )
    .meta({ "wiki.section": "scraping" }),
  databaseUrl: z
    .url()
    .describe("The database connection URL.")
    .meta({ "wiki.section": "database" }),
  databaseDebugLogging: z
    .stringbool()
    .default(false)
    .describe("Enable debug logging for the database.")
    .meta({ "wiki.section": "database" }),
  databaseSslRootCert: z
    .string()
    .transform((val) => readFileSync(val, "utf8"))
    .optional()
    .describe(
      "The file path to the SSL root certificate for the database connection.",
    )
    .meta({ "wiki.section": "database-ssl" }),
  databaseSslCert: z
    .string()
    .transform((val) => readFileSync(val, "utf8"))
    .optional()
    .describe(
      "The file path to the SSL certificate for the database connection.",
    )
    .meta({ "wiki.section": "database-ssl" }),
  databaseSslKey: z
    .string()
    .transform((val) => readFileSync(val, "utf8"))
    .optional()
    .describe("The file path to the SSL key for the database connection.")
    .meta({ "wiki.section": "database-ssl" }),
  redisUrl: z
    .url()
    .describe("The Redis server URL.")
    .meta({ "wiki.section": "database" }),
  vfsDebugLogging: z
    .stringbool()
    .default(false)
    .describe("Enable debug logging for the virtual file system.")
    .meta({ "wiki.section": "vfs" }),
  vfsMountPath: z
    .string()
    .describe("The mount point for the virtual file system.")
    .meta({ "wiki.section": "vfs" }),
  vfsForceMount: z
    .stringbool()
    .default(true)
    .describe("If true, attempts to unmount the mount-point before remounting.")
    .meta({ "wiki.section": "vfs" }),
  unsafeWipeRedisOnStartup: z
    .stringbool()
    .default(false)
    .describe(
      "**UNSAFE**.\n \nIf true, all Redis data will be removed on application startup.",
    )
    .meta({ "wiki.section": "danger-zone" }),
  unsafeWipeDatabaseOnStartup: z
    .stringbool()
    .default(false)
    .describe(
      "**UNSAFE**.\n \nIf true, the database will be wiped on application startup.",
    )
    .meta({ "wiki.section": "danger-zone" }),
  enabledLogTransports: json(z.array(z.enum(["console", "file"])))
    .default(["console", "file"])
    .describe("The enabled logging transports.")
    .meta({ "wiki.section": "logging" }),
  loggingEnabled: z
    .stringbool()
    .default(true)
    .describe("Enable or disable logging for the application.")
    .meta({ "wiki.section": "logging" }),
  logLevel: LogLevel.default("info")
    .describe("The logging level for the application.")
    .meta({ "wiki.section": "logging" }),
  logDirectory: z
    .string()
    .default("./logs")
    .describe("The directory where log files will be stored.")
    .meta({ "wiki.section": "logging" }),
  logShowStackTraces: z
    .stringbool()
    .default(true)
    .describe(
      "Whether to show detailed stack traces when unexpected errors occur.",
    )
    .meta({ "wiki.section": "logging" }),
  gqlHost: z
    .string()
    .default("localhost")
    .describe("The GraphQL server host.")
    .meta({ "wiki.section": "graphql" }),
  gqlPort: z.coerce
    .number()
    .int()
    .default(3000)
    .describe("The GraphQL server port.")
    .meta({ "wiki.section": "graphql" }),
  dubbedAnimeOnly: z
    .stringbool()
    .default(false)
    .describe("Only scrape dubbed anime.")
    .meta({ "wiki.section": "scraping" }),
  maximumScrapeAttempts: z.coerce
    .number()
    .int()
    .nonnegative()
    .default(Number.MAX_SAFE_INTEGER)
    .describe(
      "The maximum number of scrape attempts before giving up on an item.",
    )
    .meta({ "wiki.section": "scraping" }),
  minimumAverageBitrateMovies: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .describe("The minimum average bitrate for movies.")
    .meta({ "wiki.section": "scraping" }),
  minimumAverageBitrateEpisodes: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .describe("The minimum average bitrate for episodes.")
    .meta({ "wiki.section": "scraping" }),
  preferSeasonPacks: z
    .stringbool()
    .default(false)
    .describe(
      "If true, Riven will prefer to download season packs over show packs.",
    )
    .meta({ "wiki.section": "scraping" }),
  scheduleOffsetMinutes: z.coerce
    .number()
    .int()
    .nonnegative()
    .default(30)
    .describe(
      "The number of minutes to wait after an item's air date before attempting to re-index it.",
    )
    .meta({ "wiki.section": "scheduling" }),
  scrapeCooldownHours: json(
    z.tuple([
      z.int().nonnegative().default(2),
      z.int().nonnegative().default(6),
      z.int().nonnegative().default(24),
    ]),
  )
    .default([2, 6, 24])
    .describe(
      dedent`
      The cooldown periods (in hours) to apply after failed scrape attempts,
      in the format [> 2 attempts, > 5 attempts, > 10 attempts].
    `,
    )
    .meta({ "wiki.section": "scraping" }),
  unknownAirDateOffsetDays: z.coerce
    .number()
    .int()
    .nonnegative()
    .default(7)
    .describe(
      "When an episode has no air date, this number of days will be added to the current date to estimate a release date for scheduling purposes.",
    )
    .meta({ "wiki.section": "scheduling" }),
  enabledPlugins: json(z.array(CorePlugins))
    .default([])
    .describe("A list of core plugins to enable.")
    .meta({ "wiki.section": "plugins" }),
  shutdownTimeoutSeconds: json(z.int().positive())
    .default(30)
    .describe("The timeout in seconds for shutting down the application."),
  rankingConfigPath: z
    .string()
    .default("./riven-ranking-config.json")
    .describe(
      "Path to the JSON file containing the torrent ranking configuration. Auto-generated with defaults on first startup.",
    )
    .meta({ "wiki.section": "ranking" }),
  printConfigurationOnStartup: z
    .stringbool()
    .default(false)
    .describe(
      "Whether to print the effective configuration on application startup. Useful for debugging configuration issues.",
    )
    .meta({ "wiki.section": "debugging" }),
});

export type RivenSettings = z.infer<typeof RivenSettings>;
