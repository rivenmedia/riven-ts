import { type LogLevel, logger } from "../../utilities/logger/logger.ts";

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
