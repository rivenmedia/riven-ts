import { ecsFormat as baseEcsFormat } from "@elastic/ecs-winston-format";
import path from "node:path";
import { type Logform, createLogger, format, transports } from "winston";

import { settings } from "../settings.ts";
import { consoleFormat } from "./formatters/console.format.ts";
import { ecsFileFormat } from "./formatters/ecs-file.format.ts";
import { fileFormat } from "./formatters/file.format.ts";
import { otelMetaFormat } from "./formatters/otel-meta.format.ts";
import { validationErrorMetaFormat } from "./formatters/validation-error-meta.format.ts";

const logDir = path.resolve(process.cwd(), settings.logDirectory);

export const baseLogger = createLogger({
  level: settings.logLevel,
  format: format.combine(
    otelMetaFormat(),
    validationErrorMetaFormat(),
    baseEcsFormat() as Logform.Format,
  ),
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

export const logger = baseLogger.child({ "riven.log.source": "core" });
