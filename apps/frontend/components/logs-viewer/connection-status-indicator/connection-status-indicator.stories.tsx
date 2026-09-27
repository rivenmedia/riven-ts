import { preview } from "@/.storybook/preview";

import { ConnectionStatusIndicator } from "./connection-status-indicator";

const meta = preview.meta({
  title: "Logs Viewer / ConnectionStatusIndicator",
  component: ConnectionStatusIndicator,
  args: {
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
  },
});

export const Connected = meta.story({
  args: { connectionStatus: "connected" },
});

export const Connecting = meta.story({
  args: { connectionStatus: "connecting" },
});

export const Reconnecting = meta.story({
  args: { connectionStatus: "connecting", reconnectAttempts: 2 },
});

export const Disconnected = meta.story({
  args: { connectionStatus: "disconnected" },
});

export const Error = meta.story({ args: { connectionStatus: "error" } });
