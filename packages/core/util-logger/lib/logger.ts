import path from "path";
import { createLogger, format, transports } from "winston";

const logDir = path.resolve(process.cwd(), "logs");

const isTestEnvironment = process.env["NODE_ENV"] === "test";

const logFormat = format.printf(function (info) {
  return `${String(info["timestamp"])} - ${info.level}: ${JSON.stringify(info.message, null, 2)}`;
});

export type LogLevel =
  | "error"
  | "warn"
  | "info"
  | "http"
  | "verbose"
  | "debug"
  | "silly";

export const logger = createLogger({
  level: "silly",
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), logFormat),
      silent: isTestEnvironment,
    }),
  ],
  exceptionHandlers: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
      silent: isTestEnvironment,
    }),
    ...(isTestEnvironment
      ? []
      : [
          new transports.File({
            filename: "exceptions.log",
            dirname: logDir,
            silent: isTestEnvironment,
          }),
        ]),
  ],
  exitOnError: false,
});

if (!isTestEnvironment) {
  logger.add(
    new transports.File({
      filename: "error.log",
      dirname: logDir,
      level: "error",
    }),
  );

  logger.add(
    new transports.File({
      filename: "combined.log",
      dirname: logDir,
    }),
  );
}
