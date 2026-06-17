import { json } from "@repo/util-plugin-sdk/validation";

import { readFileSync } from "node:fs";
import z from "zod";

import { LogLevel } from "./utilities/logger/log-levels.ts";

export const InstanceSettings = z
  .object({
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
      .describe(
        "If true, attempts to unmount the mount-point before remounting.",
      )
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
    logDirectory: z
      .string()
      .default("./logs")
      .describe("The directory where log files will be stored.")
      .meta({ "wiki.section": "logging" }),
    logLevel: LogLevel.default("info")
      .describe("The logging level for the application.")
      .meta({ "wiki.section": "logging" }),
    logShowStackTraces: z
      .stringbool()
      .default(true)
      .describe("Whether to show detailed stack traces when logging errors")
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
    shutdownTimeoutSeconds: json(z.int().positive())
      .default(30)
      .describe("The timeout in seconds for shutting down the application."),
  })
  .describe(
    'Core instance settings for Riven. These settings are essential for the application to function correctly and are configured via environment variables prefixed with "RIVEN_INSTANCE_SETTING__".',
  );

export type InstanceSettings = z.infer<typeof InstanceSettings>;
