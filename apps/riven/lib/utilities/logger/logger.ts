import { ecsFormat as baseEcsFormat } from "@elastic/ecs-winston-format";
import path from "node:path";
import { isMainThread } from "node:worker_threads";
import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

import { GeneralSettings } from "#settings/sections/general-settings.schema.ts";
import { resolveSettings } from "#settings/utilities/resolve-settings.ts";
import { getRuntimeSettings } from "#utilities/runtime-settings.ts";
import { coreEnvironment } from "#utilities/settings.ts";

import { createConsoleFormat } from "./formatters/console.format.ts";
import { ecsFileFormat } from "./formatters/ecs-file.format.ts";
import { createFileFormat } from "./formatters/file.format.ts";
import { maskFormat } from "./formatters/mask.format.ts";
import { sentryMetaFormat } from "./formatters/sentry-meta.format.ts";
import { validationErrorMetaFormat } from "./formatters/validation-error-meta.format.ts";
import {
  excludeVfsFormat,
  onlyVfsFormat,
} from "./formatters/vfs-filter.format.ts";

import type { RuntimeSettings } from "#settings/core-settings-sections.ts";
import type { ReadonlyDeep } from "type-fest";
import type { LoggerOptions, transport as Transport } from "winston";

type LoggingSettings = ReadonlyDeep<RuntimeSettings["general"]["logging"]>;

const ecsFileName = "ecs.json";
const vfsEcsFileName = "vfs.json";

const levels = {
  data: 0, // Log level used for low-level debug logging (e.g. database debugging) - we always want this to log even with the log level set to a lower value
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
} as const satisfies LoggerOptions["levels"];

const baseFormat = format.combine(
  sentryMetaFormat(),
  validationErrorMetaFormat(),
  baseEcsFormat(),
);

export const logger = createLogger({
  levels,
  format: baseFormat,
  exitOnError: false,
});

let ecsSymlinkPath = "";
let activeTransports: Transport[] = [];

/**
 * The path to the symlink that always points at the current ECS log file.
 */
export function getEcsSymlinkPath() {
  return ecsSymlinkPath;
}

function createTransports(
  loggingSettings: LoggingSettings,
  logDir: string,
  ecsLogDir: string,
) {
  const loggerTransports: Transport[] = [];
  const exceptionHandlers: Transport[] = [];

  if (!loggingSettings.loggingEnabled) {
    return {
      loggerTransports,
      exceptionHandlers,
    };
  }

  const fileFormat = createFileFormat({
    showStackTraces: loggingSettings.logShowStackTraces,
  });

  // ECS logs will always be created for debugging purposes
  loggerTransports.push(
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
    // VFS ECS logs are split into their own file to keep the main ECS file
    // within reasonable size limits and easier to parse.
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

  if (loggingSettings.enabledLogTransports.includes("console")) {
    loggerTransports.push(
      new transports.Console({
        format: format.combine(
          format.colorize({
            level: process.stdout.isTTY,
          }),
          createConsoleFormat({
            showStackTraces: loggingSettings.logShowStackTraces,
          }),
        ),
      }),
    );
  }

  if (loggingSettings.enabledLogTransports.includes("file")) {
    loggerTransports.push(
      new transports.File({
        filename: "error.log",
        dirname: logDir,
        level: "error",
        tailable: true,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        format: format.combine(excludeVfsFormat(), maskFormat(), fileFormat),
      }),
      new transports.File({
        filename: "combined.log",
        dirname: logDir,
        tailable: true,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        format: format.combine(excludeVfsFormat(), maskFormat(), fileFormat),
      }),
      new transports.File({
        filename: "vfs.log",
        dirname: logDir,
        tailable: true,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        format: format.combine(onlyVfsFormat(), maskFormat(), fileFormat),
      }),
    );

    exceptionHandlers.push(
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

  return { loggerTransports, exceptionHandlers };
}

/**
 * (Re)configures the logger's level and transports from the logging settings.
 *
 * Any previously configured transports are closed.
 */
export function configureLogger(loggingSettings: LoggingSettings) {
  const logDir = path.resolve(process.cwd(), loggingSettings.logDirectory);
  const ecsLogDir = path.join(logDir, "ecs");
  const { loggerTransports, exceptionHandlers } = createTransports(
    loggingSettings,
    logDir,
    ecsLogDir,
  );
  const previousTransports = activeTransports;

  logger.configure({
    levels,
    format: baseFormat,
    exitOnError: false,
    level: loggingSettings.logLevel,
    silent: !loggingSettings.loggingEnabled,
    transports: loggerTransports,
    ...(exceptionHandlers.length > 0 ? { exceptionHandlers } : {}),
  });

  ecsSymlinkPath = path.join(ecsLogDir, ecsFileName);
  activeTransports = [...loggerTransports, ...exceptionHandlers];

  for (const transport of previousTransports) {
    transport.close?.();
  }
}

/**
 * Worker threads are created after the runtime settings have loaded, so use them directly.
 * The main thread starts with env-only values until bootstrap loads the stored settings.
 */
function getInitialLoggingSettings(): LoggingSettings {
  if (!isMainThread) {
    return getRuntimeSettings().general.logging;
  }

  return resolveSettings({
    schema: GeneralSettings,
    stored: {},
    env: coreEnvironment,
  }).value.logging;
}

configureLogger(getInitialLoggingSettings());
