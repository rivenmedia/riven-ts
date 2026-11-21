import { expect, it } from "vitest";

import { getConnectionStatusText } from "./get-connection-status-text.ts";

it.for([
  ["connected", 0, "Connected"],
  ["connecting", 0, "Connecting..."],
  ["connecting", 2, "Reconnecting... (2/5)"],
  ["disconnected", 3, "Disconnected"],
  ["error", 5, "Connection Error"],
] as const)(
  "describes the %s status after %i reconnect attempts as %j",
  ([status, attempts, expected]) => {
    expect(getConnectionStatusText(status, attempts, 5)).toBe(expected);
  },
);
