import { cn } from "cn";

import { getConnectionStatusText } from "../_utilities/get-connection-status-text";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface ConnectionStatusIndicatorProps {
  connectionStatus: ConnectionStatus;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

export function ConnectionStatusIndicator({
  connectionStatus,
  maxReconnectAttempts,
  reconnectAttempts,
}: ConnectionStatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          connectionStatus === "connected" && "bg-green-500",
          connectionStatus === "connecting" && "bg-yellow-500 animate-pulse",
          connectionStatus === "disconnected" && "bg-gray-500",
          connectionStatus === "error" && "bg-red-500",
          "h-2 w-2 rounded-full",
        )}
      />
      <span className="text-muted-foreground text-sm">
        {getConnectionStatusText(
          connectionStatus,
          reconnectAttempts,
          maxReconnectAttempts,
        )}
      </span>
    </div>
  );
}
