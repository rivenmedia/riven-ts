import { expect, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { authConfig } from "#auth/auth.ts";
import { getLogContext } from "#utilities/logger/log-context.ts";
import { logger } from "#utilities/logger/logger.ts";

const it = baseIt.extend(
  "spyOnLoggerWarn",
  () => () => vi.spyOn(logger, "warn"),
);

it.for([
  { logLevel: "silly", expected: "debug" },
  { logLevel: "verbose", expected: "debug" },
  { logLevel: "debug", expected: "debug" },
  { logLevel: "http", expected: "info" },
  { logLevel: "info", expected: "info" },
  { logLevel: "warn", expected: "warn" },
  { logLevel: "error", expected: "error" },
] as const)(
  "logs auth messages at $expected when the log level is $logLevel",
  ({ logLevel, expected }, { overrideRuntimeSettings }) => {
    overrideRuntimeSettings({ general: { logging: { logLevel } } });

    expect(authConfig.logger.level).toBe(expected);
  },
);

it("disables auth logging when logging is disabled", ({
  overrideRuntimeSettings,
}) => {
  overrideRuntimeSettings({ general: { logging: { loggingEnabled: false } } });

  expect(authConfig.logger.disabled).toBe(true);

  overrideRuntimeSettings({ general: { logging: { loggingEnabled: true } } });

  expect(authConfig.logger.disabled).toBe(false);
});

it("writes auth messages to the logger with the auth log source", ({
  spyOnLoggerWarn,
}) => {
  const sources: unknown[] = [];

  spyOnLoggerWarn().mockImplementation(() => {
    sources.push(getLogContext()["riven.log.source"]);

    return logger;
  });

  authConfig.logger.log("warn", "Session expired", { userId: "user-id" });

  expect(logger.warn).toHaveBeenCalledExactlyOnceWith("Session expired", {
    userId: "user-id",
  });
  expect(sources).toStrictEqual(["auth"]);
});
