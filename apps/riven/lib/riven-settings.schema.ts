// oxlint-disable node/no-sync

import { json } from "@repo/util-plugin-sdk/validation";

import { readFileSync } from "node:fs";
import z from "zod";

export const RivenSettings = z.object({
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
  unsafeWipeUsersOnStartup: z
    .stringbool()
    .default(false)
    .describe(
      "**UNSAFE**.\n \nIf true, all user data will be removed on application startup.",
    )
    .meta({ "wiki.section": "danger-zone" }),
  host: z
    .string()
    .default("localhost")
    .describe("The API server host.")
    .meta({ "wiki.section": "server" }),
  port: z.coerce
    .number()
    .int()
    .default(3000)
    .describe("The API server port.")
    .meta({ "wiki.section": "server" }),
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
  adminUserCredentials: z
    .templateLiteral([z.string().min(1), z.literal(":"), z.string().min(1)])
    .optional()
    .transform((val) => {
      if (!val) {
        return null;
      }

      const [username, password] = val.split(":");

      if (!username || !password) {
        throw new Error(
          "Invalid admin user credentials format. Expected 'username:password'",
        );
      }

      return { username, password };
    })
    .describe("The admin user credentials - in the format username:password"),
});

export type RivenSettings = z.infer<typeof RivenSettings>;
