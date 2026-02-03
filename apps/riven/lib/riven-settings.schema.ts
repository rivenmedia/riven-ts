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
  logLevel: LogLevel.default("info").describe(
    "The logging level for the application.",
  ),
  logDirectory: z
    .string()
    .default("./logs")
    .describe("The directory where log files will be stored."),
  jaegerUrl: z.url().optional().describe("The Jaeger tracing server URL."),
  gqlPort: z.coerce
    .number()
    .int()
    .default(3000)
    .describe("The GraphQL server port."),
});
