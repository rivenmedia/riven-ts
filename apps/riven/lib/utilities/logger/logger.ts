import path from "node:path";
import { type Logger, createLogger, format, transports } from "winston";

import { settings } from "../settings.ts";

const logDir = path.resolve(process.cwd(), settings.logDirectory);

export const logFormat: Logger["format"] = format.printf(function (info) {
  return `${String(info["timestamp"])} - ${info.level}: ${JSON.stringify(
    info["stack"] ?? info.message,
    null,
    2,
  )}`;
});

export const logger = createLogger({
  level: settings.logLevel,
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json({
      space: 2,
    }),
  ),
  exitOnError: false,
  silent: !settings.loggingEnabled,
});

if (settings.loggingEnabled) {
  if (settings.enabledLogTransports.includes("console")) {
    logger.add(
      new transports.Console({
        format: format.combine(
          format.json({ space: 2 }),
          format.colorize(),
          logFormat,
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
        zippedArchive: true,
      }),
    );

    logger.add(
      new transports.File({
        filename: "combined.log",
        dirname: logDir,
        tailable: true,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      }),
    );

    logger.exceptions.handle(
      new transports.File({
        filename: "exceptions.log",
        dirname: logDir,
        tailable: true,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      }),
    );
  }
}
