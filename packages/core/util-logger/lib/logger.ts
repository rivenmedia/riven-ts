import path from "path";
import { createLogger, format, transports } from "winston";

const logDir = path.resolve(
  process.cwd(),
  process.env["LOG_DIRECTORY"] ?? "logs",
);

const isProductionEnvironment = process.env["NODE_ENV"] === "production";
const isTestEnvironment = process.env["NODE_ENV"] === "test";

const logFormat = format.printf(function (info) {
  return `${String(info["timestamp"])} - ${info.level}: ${JSON.stringify(
    info["stack"] ?? info.message,
    null,
    2,
  )}`;
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
  level: process.env["LOG_LEVEL"] ?? "info",
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
  transports: [
    new transports.Console({
      format: format.combine(
        format.json({ space: 2 }),
        format.colorize(),
        logFormat,
      ),
      silent: isTestEnvironment,
    }),
  ],
  exceptionHandlers: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
      silent: !isProductionEnvironment,
    }),
    ...(!isProductionEnvironment
      ? []
      : [
          new transports.File({
            filename: "exceptions.log",
            dirname: logDir,
            silent: !isProductionEnvironment,
            tailable: true,
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
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
}
