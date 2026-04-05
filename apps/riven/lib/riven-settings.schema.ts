import { json } from "@repo/util-plugin-sdk/validation";

import { type } from "arktype";

import { LogLevel } from "./utilities/logger/log-levels.ts";

export const RivenSettings = type({
  databaseUrl: "string.url",
  redisUrl: "string.url",
  vfsDebugLogging: json.to("boolean").default("false"),
  vfsMountPath: "string > 0",
  vfsForceMount: json.to("boolean").default("true"),
  unsafeClearQueuesOnStartup: json.to("boolean").default("false"),
  unsafeRefreshDatabaseOnStartup: json.to("boolean").default("false"),
  enabledLogTransports: json
    .to("('console' | 'file')[]")
    .default(() => '["console", "file"]'),
  loggingEnabled: json.to("boolean").default("true"),
  logLevel: LogLevel.default("info"),
  logDirectory: type("string").default("./logs"),
  logShowStackTraces: json.to("boolean").default("true"),
  gqlPort: json.to("number.integer > 0").default("3000"),
  dubbedAnimeOnly: json.to("boolean").default("false"),
  "minimumAverageBitrateMovies?": json.to("number.integer > 0"),
  "minimumAverageBitrateEpisodes?": json.to("number.integer > 0"),
  scheduleOffsetMinutes: json.to("number.integer >= 0").default("30"),
  unknownAirDateOffsetDays: json.to("number.integer >= 0").default("7"),
});
