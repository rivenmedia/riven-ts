import { logger } from "#utilities/logger/logger.ts";

import type { LogLevel } from "@repo/util-plugin-sdk/dto/enums/log-level.enum";

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
} as const;
