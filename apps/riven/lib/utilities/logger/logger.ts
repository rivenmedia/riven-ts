import chalk from "chalk";
import path from "node:path";
import { createLogger, format, transports } from "winston";

import { settings } from "../settings.ts";

const logDir = path.resolve(process.cwd(), settings.logDirectory);

const fileFormat = format.combine(
  format.uncolorize(),
  format((info) => {
    info.message = String(info["stack"] ?? info.message);

    return info;
  })(),
  format.json({ space: 2 }),
);

const consoleFormat = format.printf(({ level, message, ...meta }) => {
  const renderedMessage = String(meta["stack"] ?? message);
  const maybeColoredMessage = level.includes("error")
    ? chalk.red(renderedMessage)
    : renderedMessage;

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
}

export const logger = baseLogger.child({ logSource: "core" });
