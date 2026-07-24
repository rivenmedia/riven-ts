import { FatalValidationError } from "@repo/util-plugin-sdk/errors/fatal-validation-error";

import { UnrecoverableError } from "bullmq";
import chalk from "chalk";
import { DateTime } from "luxon";
import { SPLAT } from "triple-beam";
import { format } from "winston";
import z, { ZodError } from "zod";

import { settings } from "../../settings.ts";
import { ErrorSplat } from "../schemas/error-splat.schema.ts";

import type { TransformableInfo } from "logform";

/** An error after `ecsFormat` has serialised it onto the log entry. */
type LoggedError = NonNullable<TransformableInfo["error"]>;

/**
 * Errors we throw deliberately to signal an expected, terminal outcome (e.g. a
 * media item that cannot be downloaded). The message says everything useful, so
 * their stack traces are noise in the console/file logs — the full trace is
 * still written to the ECS logs.
 */
const EXPECTED_ERROR_NAMES = new Set([
  FatalValidationError.name,
  UnrecoverableError.name,
]);

function isUnexpectedError(error: Error | LoggedError) {
  return !EXPECTED_ERROR_NAMES.has(
    error instanceof Error ? error.name : (error.name ?? error.type),
  );
}

function getErrorOutput(error: Error | LoggedError | null) {
  if (!error) {
    return;
  }

  const { logShowStackTraces } = settings;
  const showStackTrace = logShowStackTraces && isUnexpectedError(error);

  if (error instanceof ZodError) {
    // If we have a validation error, prettify the output if stack traces are disabled
    return showStackTrace ? error.stack : z.prettifyError(error);
  }

  if (error instanceof Error) {
    return showStackTrace ? error.stack : error.message;
  }

  // For regular errors, always show the raw error output if stack traces are enabled, else show the message
  return showStackTrace ? error.stack_trace : error.message;
}

export const consoleFormat = format.printf(({ level, message, ...meta }) => {
  const parsedSplat = Array.isArray(meta[SPLAT])
    ? ErrorSplat.safeParse(meta[SPLAT][0])
    : undefined;

  const renderedMessage = [
    typeof message === "string" ? message : parsedSplat?.data?.message,
    getErrorOutput(parsedSplat?.data ?? meta.error ?? null),
  ]
    .filter(Boolean)
    .join(" ");

  const maybeColouredMessage =
    meta["log.level"] === "error"
      ? chalk.red(renderedMessage)
      : renderedMessage;

  const formattedTimestamp = DateTime.fromISO(meta["@timestamp"]).toFormat(
    "yyyy-LL-dd TT",
  );

  const tags = [
    chalk.dim.black(formattedTimestamp),
    ...[
      meta["riven.log.source"],
      meta["riven.plugin.name"],
      meta["riven.worker.id"],
    ].map((tag) => tag && chalk.dim(tag)),
  ]
    .filter(Boolean)
    .join(" - ");

  return `${tags} - ${level}: ${maybeColouredMessage}`;
});
