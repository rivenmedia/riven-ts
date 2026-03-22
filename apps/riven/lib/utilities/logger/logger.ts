import chalk from "chalk";
import path from "node:path";
import { createLogger, format, transports } from "winston";

import { settings } from "../settings.ts";

const logDir = path.resolve(process.cwd(), settings.logDirectory);

const fileFormat = format.combine(
  format.json({ space: 2 }),
  format.printf(({ level, message, ...meta }) =>
    chalk.reset(
      `${String(meta["timestamp"])} - ${String(meta["logSource"])} - ${level}: ${String(
        meta["stack"] ?? message,
      )}`,
    ),
  ),
  format.uncolorize(),
);

const consoleFormat = format.printf(({ level, message, ...meta }) => {
  const maybeColoredMessage = level.includes("error")
    ? chalk.red(message)
    : String(message);

  return `${chalk.dim.black(meta["timestamp"])} - ${chalk.dim(meta["logSource"])} - ${level}: ${maybeColoredMessage}`;
});

export const baseLogger = createLogger({
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
    baseLogger.add(
      new transports.Console({
        format: format.combine(
          format.json({ space: 2 }),
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
}

export const logger = baseLogger.child({ logSource: "core" });
