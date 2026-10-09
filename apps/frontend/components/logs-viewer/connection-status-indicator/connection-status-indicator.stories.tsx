import { preview } from "#.storybook/preview.tsx";

import { ConnectionStatusIndicator } from "./connection-status-indicator.tsx";

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

export const ErrorStatus = meta.story({
  name: "Error",
  args: { connectionStatus: "error" },
});
