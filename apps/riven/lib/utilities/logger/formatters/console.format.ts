import chalk from "chalk";
import { DateTime } from "luxon";
import { SPLAT } from "triple-beam";
import { format } from "winston";
import z from "zod";

import { settings } from "../../settings.ts";
import { ErrorSplat } from "../schemas/error-splat.schema.ts";

export const consoleFormat = format.printf(({ level, message, ...meta }) => {
  const parsedSplat = Array.isArray(meta[SPLAT])
    ? ErrorSplat.safeParse(meta[SPLAT][0])
    : undefined;

  const renderedMessage = [
    typeof message === "string" ? message : parsedSplat?.data?.message,
    parsedSplat?.success
      ? z.prettifyError(parsedSplat.data)
      : settings.logShowStackTraces
        ? meta.error?.stack_trace
        : meta.error?.message,
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

  return `${chalk.dim.black(formattedTimestamp)} - ${chalk.dim(meta["riven.log.source"])} - ${level}: ${maybeColouredMessage}`;
});
