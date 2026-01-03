import { type LogLevel, logger } from "@repo/core-util-logger";

export const withLogAction = {
  actions: {
    log: (
      _: unknown,
      {
        message,
        level = "info",
      }: {
        message: string;
        level?: LogLevel;
      },
    ) => {
      logger[level](message);
    },
  },
};
