import { logger } from "../../utilities/logger/logger.ts";

import type { LogLevel } from "../../utilities/logger/log-levels.ts";

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
