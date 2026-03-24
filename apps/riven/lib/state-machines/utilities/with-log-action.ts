import { logger } from "../../utilities/logger/logger.ts";

import type { LogLevel } from "../../utilities/logger/log-levels.ts";

export const withLogAction = {
  actions: {
    log: (
      _: unknown,
      {
        error,
        message,
        level = "info",
      }: {
        error?: unknown;
        message: string;
        level?: LogLevel;
      },
    ) => {
      if (error) {
        logger[level](message, { err: error });
      } else {
        logger[level](message);
      }
    },
  },
};
