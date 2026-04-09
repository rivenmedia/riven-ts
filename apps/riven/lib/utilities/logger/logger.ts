import "./types/logform.ts";

import { ecsFormat as baseEcsFormat } from "@elastic/ecs-winston-format";
import path from "node:path";
import { createLogger, format, transports } from "winston";

import { settings } from "../settings.ts";
import { consoleFormat } from "./formatters/console.format.ts";
import { ecsFileFormat } from "./formatters/ecs-file.format.ts";
import { fileFormat } from "./formatters/file.format.ts";
import { sentryMetaFormat } from "./formatters/sentry-meta.format.ts";
import { validationErrorMetaFormat } from "./formatters/validation-error-meta.format.ts";

const logDir = path.resolve(process.cwd(), settings.logDirectory);

export const logger = createLogger({
  level: settings.logLevel,
  format: format.combine(
    sentryMetaFormat(),
    validationErrorMetaFormat(),
    baseEcsFormat(),
  ),
  exitOnError: false,
  silent: !settings.loggingEnabled,
});

if (settings.loggingEnabled) {
  // ECS logs will always be created for debugging purposes
  logger.add(
    new transports.File({
      filename: "ecs.json",
      dirname: logDir,
      tailable: true,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      format: ecsFileFormat,
      zippedArchive: true,
    }),
  );

  if (settings.enabledLogTransports.includes("console")) {
    logger.add(
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
    logger.add(
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

    logger.add(
      new transports.File({
        filename: "combined.log",
        dirname: logDir,
        tailable: true,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        format: fileFormat,
      }),
    );

    logger.exceptions.handle(
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
}
