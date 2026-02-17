import z from "zod";

import { logger } from "./utilities/logger/logger.ts";

import type { LogEntry } from "winston";

const { data: spotlightEnabled } = z
  .stringbool()
  .safeParse(process.env["SENTRY_SPOTLIGHT"] ?? "0");

if (spotlightEnabled) {
  const Sentry = await import("@sentry/node");

  const { data: spotlightClearOnStartup } = z
    .stringbool()
    .safeParse(process.env["SENTRY_SPOTLIGHT_CLEAR_ON_STARTUP"] ?? "0");

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

  const sentryLogLevelEnum = z.enum([
    "trace",
    "debug",
    "info",
    "warn",
    "error",
    "fatal",
  ]);

  logger.on("data", ({ message, level, ...rest }: LogEntry) => {
    const parsedLogLevel = sentryLogLevelEnum.safeParse(level);

    if (parsedLogLevel.success) {
      Sentry.logger[parsedLogLevel.data](message, rest);
    } else {
      Sentry.logger.trace(message, rest);
    }
  });
} else {
  logger.warn(
    "Sentry Spotlight integration is disabled. Set SENTRY_SPOTLIGHT=1 to enable it.",
  );
}
