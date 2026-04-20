import chalk from "chalk";
import { DateTime } from "luxon";
import { SPLAT } from "triple-beam";
import { format } from "winston";
import z, { ZodError } from "zod";

import { settings } from "../../settings.ts";
import { ErrorSplat } from "../schemas/error-splat.schema.ts";

import type { TransformableInfo } from "logform";

function getErrorOutput(error: Error | TransformableInfo["error"] | null) {
  if (!error) {
    return;
  }

  const { logShowStackTraces } = settings;

  if (error instanceof ZodError) {
    // If we have a validation error, prettify the output if stack traces are disabled
    return logShowStackTraces ? error.stack : z.prettifyError(error);
  }

  if (error instanceof Error) {
    return logShowStackTraces ? error.stack : error.message;
  }

  // For regular errors, always show the raw error output if stack traces are enabled, else show the message
  return logShowStackTraces ? error.stack_trace : error.message;
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
    ...[meta["riven.log.source"], meta["riven.worker.id"]].map(
      (tag) => tag && chalk.dim(tag),
    ),
  ]
    .filter(Boolean)
    .join(" - ");

  return `${tags} - ${level}: ${maybeColouredMessage}`;
});
