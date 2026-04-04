import { type } from "arktype";

import { logger } from "./utilities/logger/logger.ts";

import type { LogEntry } from "winston";

const spotlightEnabled = type("'true' | 'false'").pipe((val) => !!val)(
  process.env["SENTRY_SPOTLIGHT"] ?? "false",
);

if (spotlightEnabled) {
  const Sentry = await import("@sentry/node");

  const spotlightClearOnStartup = type("'true' | 'false'").pipe((val) => !!val)(
    process.env["SENTRY_SPOTLIGHT_CLEAR_ON_STARTUP"] ?? "0",
  );

  // Clear any existing Sentry events from the local server before starting the application.
  if (spotlightClearOnStartup) {
    await fetch("http://localhost:8969/clear", { method: "DELETE" });
  }

  Sentry.init({
    dsn: "https://spotlight@local/0",
    enableLogs: true,
    sampleRate: 1,
    tracesSampleRate: 1,
    beforeSendTransaction(event) {
      if (
        ["extendLocks", "moveStalledJobsToWait"].includes(
          String(event.contexts?.trace?.data?.["bullmq.queue.operation"]),
        )
      ) {
        return null;
      }

      for (const span of event.spans ?? []) {
        if (span.data["bullmq.queue.operation"] === "fail") {
          span.status = "error";

          if (event.contexts?.trace) {
            event.contexts.trace.status = "error";
          }

          break;
        }
      }

      return event;
    },
  });

  const sentryLogLevelEnum = type.enumerated(
    "trace",
    "debug",
    "info",
    "warn",
    "error",
    "fatal",
  );

  logger.on("data", ({ message, level, ...rest }: LogEntry) => {
    const parsedLogLevel = sentryLogLevelEnum(level);

    if (parsedLogLevel instanceof type.errors) {
      Sentry.logger.trace(message, rest);
    } else {
      Sentry.logger[parsedLogLevel](message, rest);
    }
  });
} else {
  logger.warn(
    "Sentry Spotlight integration is disabled. Set SENTRY_SPOTLIGHT=1 to enable it.",
  );
}
