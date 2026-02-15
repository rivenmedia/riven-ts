import z from "zod";

import { logger } from "./utilities/logger/logger.ts";

const { data: spotlightEnabled } = z
  .stringbool()
  .safeParse(process.env["SENTRY_SPOTLIGHT"] ?? "0");

if (spotlightEnabled) {
  const Sentry = await import("@sentry/node");
  const {
    default: { default: SentryTransport },
  } = await import("winston-transport-sentry-node");

  // Ensure to call this before requiring any other modules!
  Sentry.init({
    dsn: "https://spotlight@local/0",
    integrations: [
      Sentry.captureConsoleIntegration({
        levels: ["log", "info", "warn", "error", "debug"],
      }),
      Sentry.spotlightIntegration(),
    ],
    tracesSampleRate: 1,
  });

  logger.add(
    new SentryTransport({
      sentry: {
        dsn: "https://spotlight@local/0",
      },
      level: "info",
    }),
  );
}
