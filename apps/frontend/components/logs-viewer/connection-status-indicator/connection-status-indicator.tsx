import { cn } from "@/lib/utils";

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
  function renderStatusText() {
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
        {renderStatusText()}
      </span>
    </div>
  );
}
