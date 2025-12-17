import { createLogger, format, transports } from "winston";

const logDir = "/riven-ts/data/logs";

const isTestEnvironment = process.env["NODE_ENV"] === "test";

export const logger = createLogger({
  level: "info",
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
      format: format.combine(format.colorize(), format.simple()),
      silent: isTestEnvironment,
    }),
  ],
  exceptionHandlers: [
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
