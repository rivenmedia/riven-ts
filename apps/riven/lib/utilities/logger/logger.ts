import chalk from "chalk";
import path from "node:path";
import { createLogger, format, transports } from "winston";

import { settings } from "../settings.ts";

const logDir = path.resolve(process.cwd(), settings.logDirectory);

const fileFormat = format.combine(
  format.json({ space: 2 }),
  format.printf(function (info) {
    return chalk.reset(
      `${String(info["timestamp"])} - ${info.level}: ${String(
        info["stack"] ?? info.message,
      )}`,
    );
  }),
  format.uncolorize(),
);

const consoleFormat = format.printf(
  ({ level, message, ...meta }) =>
    `${chalk.dim.black(meta["timestamp"])} - ${level}: ${String(message)}`,
);

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
          format.colorize({
            level: process.stdout.isTTY,
          }),
          consoleFormat,
          // logFormat,
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
