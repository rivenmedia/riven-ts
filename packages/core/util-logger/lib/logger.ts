import { createLogger, format, transports } from "winston";

const logDir = "/riven-ts/data/logs";

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
    new transports.File({ filename: `${logDir}/error.log`, level: "error" }),
    new transports.File({ filename: `${logDir}/combined.log` }),
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  ],
});
