import { preview } from "@/.storybook/preview";

import { LogEntryRow } from "./log-entry-row";

const meta = preview.meta({
  title: "Logs Viewer / LogEntryRow",
  component: LogEntryRow,
});

export const Info = meta.story({
  args: {
    log: {
      timestamp: "2024-06-12 10:32:01",
      level: "info",
      source: "riven::server",
      message: "Server started successfully",
    },
  },
});

export const Error = meta.story({
  args: {
    log: {
      timestamp: "2024-06-12 10:32:05",
      level: "error",
      source: "riven::scraper",
      message: "Failed to connect to indexer: connection timed out",
    },
  },
});

export const Warn = meta.story({
  args: {
    log: {
      timestamp: "2024-06-12 10:32:10",
      level: "warn",
      source: "riven::db",
      message: "Slow query detected (312ms)",
    },
  },
});

export const Debug = meta.story({
  args: {
    log: {
      timestamp: "2024-06-12 10:32:15",
      level: "debug",
      source: "riven::graphql",
      message: "Resolved query in 4ms",
    },
  },
});
