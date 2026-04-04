import { type } from "arktype";
import chalk from "chalk";
import { DateTime } from "luxon";
import { SPLAT } from "triple-beam";
import { format } from "winston";

import { settings } from "../../settings.ts";
import { ErrorSplat } from "../schemas/error-splat.schema.ts";

function getErrorOutput(error: Error | type.errors | string) {
  if (!error) {
    return;
  }

  const { logShowStackTraces } = settings;

  if (typeof error === "string") {
    // For string errors, we have a stack trace. Only return if stack traces are enabled.
    return logShowStackTraces ? error : undefined;
  }

  if (error instanceof type.errors) {
    // If we have a validation error, prettify the output if stack traces are disabled
    return logShowStackTraces ? error.summary : error.summary; // TODO: Find stack trace for Ark errors
  }

  // For regular errors, always show the raw error output if stack traces are enabled, else show the message
  return logShowStackTraces ? error.stack : error.message;
}

export const consoleFormat = format.printf(({ level, message, ...meta }) => {
  const parsedSplat = Array.isArray(meta[SPLAT])
    ? ErrorSplat(meta[SPLAT][0])
    : undefined;

  const renderedMessage = [
    typeof message === "string" ? message : parsedSplat?.summary,
    getErrorOutput(parsedSplat ?? meta.error?.stack_trace ?? ""),
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
    ...[meta["riven.log.source"], meta["riven.worker.id"]].map(
      (tag) => tag && chalk.dim(tag),
    ),
  ]
    .filter(Boolean)
    .join(" - ");

  return `${tags} - ${level}: ${maybeColouredMessage}`;
});
