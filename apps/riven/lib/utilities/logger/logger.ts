import "./types/logform.ts";
import { ecsFormat as baseEcsFormat } from "@elastic/ecs-winston-format";
import path from "node:path";
import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

import { settings } from "../settings.ts";
import { consoleFormat } from "./formatters/console.format.ts";
import { ecsFileFormat } from "./formatters/ecs-file.format.ts";
import { fileFormat } from "./formatters/file.format.ts";
import { maskFormat } from "./formatters/mask.format.ts";
import { sentryMetaFormat } from "./formatters/sentry-meta.format.ts";
import { validationErrorMetaFormat } from "./formatters/validation-error-meta.format.ts";
import {
  excludeVfsFormat,
  onlyVfsFormat,
} from "./formatters/vfs-filter.format.ts";

const logDir = path.resolve(process.cwd(), settings.logDirectory);
const ecsLogDir = path.join(logDir, "ecs");
const ecsFileName = "ecs.json";
const vfsEcsFileName = "vfs.json";

export const ecsSymlinkPath = path.join(ecsLogDir, ecsFileName);

export const logger = createLogger({
  level: settings.logLevel,
  levels: {
    data: 0, // Log level used for low-level debug logging (e.g. database debugging) - we always want this to log even with the log level set to a lower value
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  },
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
    new DailyRotateFile({
      frequency: "24h",
      dirname: ecsLogDir,
      filename: "ecs.log.%DATE%",
      maxFiles: "5d",
      format: format.combine(excludeVfsFormat(), maskFormat(), ecsFileFormat),
      zippedArchive: true,
      level: "silly", // Send ALL logs to ECS, regardless of log level config
      json: true,
      utc: true,
      createSymlink: true,
      symlinkName: ecsFileName,
      auditFile: path.join(ecsLogDir, ".audit.json"),
    }),
  );

  // VFS ECS logs are split into their own file to keep the main ECS file
  // within reasonable size limits and easier to parse.
  logger.add(
    new DailyRotateFile({
      frequency: "24h",
      dirname: ecsLogDir,
      filename: "vfs.log.%DATE%",
      maxFiles: "5d",
      format: format.combine(onlyVfsFormat(), maskFormat(), ecsFileFormat),
      zippedArchive: true,
      level: "silly",
      json: true,
      utc: true,
      createSymlink: true,
      symlinkName: vfsEcsFileName,
      auditFile: path.join(ecsLogDir, ".vfs-audit.json"),
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
        format: format.combine(excludeVfsFormat(), maskFormat(), fileFormat),
      }),
    );

    logger.add(
      new transports.File({
        filename: "combined.log",
        dirname: logDir,
        tailable: true,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        format: format.combine(excludeVfsFormat(), maskFormat(), fileFormat),
      }),
    );

    logger.add(
      new transports.File({
        filename: "vfs.log",
        dirname: logDir,
        tailable: true,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        format: format.combine(onlyVfsFormat(), maskFormat(), fileFormat),
      }),
    );

    logger.exceptions.handle(
      new transports.File({
        filename: "exceptions.log",
        dirname: logDir,
        tailable: true,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        format: format.combine(maskFormat(), fileFormat),
      }),
    );
  }
}
