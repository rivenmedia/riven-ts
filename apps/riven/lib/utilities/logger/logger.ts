import { ecsFormat as baseEcsFormat } from "@elastic/ecs-winston-format";
import chalk from "chalk";
import { DateTime } from "luxon";
import path from "node:path";
import { SPLAT } from "triple-beam";
import { type Logform, createLogger, format, transports } from "winston";
import z, { ZodError } from "zod";

import { settings } from "../settings.ts";

import type { LogLevel } from "./log-levels.ts";

interface CustomLogMeta {
  "log.source": string;
}

declare module "logform" {
  export interface TransformableInfo extends CustomLogMeta {
    "@timestamp": string;
    "log.level": LogLevel;
    "ecs.version": string;
    error?: {
      name?: string;
      message: string;
      type: string;
      stack_trace: string;
    };
  }
}

const logDir = path.resolve(process.cwd(), settings.logDirectory);

const fileFormat = format.combine(
  format.uncolorize(),
  format((info) => {
    info.message = String(info["stack"] ?? info.message);

    return info;
  })(),
  format.json({ space: 2 }),
);

const ecsFileFormat = format.combine(
  format.uncolorize(),
  baseEcsFormat() as Logform.Format,
);

const ErrorSplat = z
  .union([
    z.object({
      err: z.instanceof(ZodError),
    }),
    z.instanceof(ZodError),
  ])
  .transform((err) => (err instanceof Error ? err : err.err));

const consoleFormat = format.printf(({ level, message, ...meta }) => {
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

  return `${chalk.dim.black(formattedTimestamp)} - ${chalk.dim(meta["log.source"])} - ${level}: ${maybeColouredMessage}`;
});

export const baseLogger = createLogger({
  level: settings.logLevel,
  format: baseEcsFormat() as Logform.Format,
  exitOnError: false,
  silent: !settings.loggingEnabled,
});

if (settings.loggingEnabled) {
  if (settings.enabledLogTransports.includes("console")) {
    baseLogger.add(
      new transports.Console({
        format: format.combine(
          format.colorize({
            level: process.stdout.isTTY,
          }),
          consoleFormat,
        ),
      }),
    );
  }

  if (settings.enabledLogTransports.includes("file")) {
    baseLogger.add(
      new transports.File({
        filename: "error.log",
        dirname: logDir,
        level: "error",
        tailable: true,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        format: fileFormat,
      }),
    );

    baseLogger.add(
      new transports.File({
        filename: "combined.log",
        dirname: logDir,
        tailable: true,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        format: fileFormat,
      }),
    );

    baseLogger.exceptions.handle(
      new transports.File({
        filename: "exceptions.log",
        dirname: logDir,
        tailable: true,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        format: fileFormat,
      }),
    );
  }

  if (settings.enabledLogTransports.includes("ecs")) {
    baseLogger.add(
      new transports.File({
        filename: "ecs-error.json",
        dirname: logDir,
        level: "error",
        tailable: true,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        format: ecsFileFormat,
      }),
    );

    baseLogger.add(
      new transports.File({
        filename: "ecs-combined.json",
        dirname: logDir,
        tailable: true,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        format: ecsFileFormat,
      }),
    );

    baseLogger.exceptions.handle(
      new transports.File({
        filename: "ecs-exceptions.json",
        dirname: logDir,
        tailable: true,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        format: ecsFileFormat,
      }),
    );
  }
}

export const logger = baseLogger.child({ "log.source": "core" });
