import type { ConnectionStatus } from "../connection-status-indicator/connection-status-indicator";

export function getConnectionStatusText(
  connectionStatus: ConnectionStatus,
  reconnectAttempts: number,
  maxReconnectAttempts: number,
) {
  switch (connectionStatus) {
    case "connected": {
      return "Connected";
    }
    case "connecting": {
      return reconnectAttempts > 0
        ? `Reconnecting... (${reconnectAttempts.toString()}/${maxReconnectAttempts.toString()})`
        : "Connecting...";
    }
    case "disconnected": {
      return "Disconnected";
    }
    case "error": {
      return "Connection Error";
    }
  }
}
