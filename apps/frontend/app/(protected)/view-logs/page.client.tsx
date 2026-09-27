import { Button } from "@/components/_ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/_ui/tabs";
import { getConnectionStatusText } from "@/components/logs-viewer/_utilities/get-connection-status-text";
import { ConnectionStatusIndicator } from "@/components/logs-viewer/connection-status-indicator/connection-status-indicator";
import { EmptyState } from "@/components/logs-viewer/empty-state/empty-state";
import { ErrorDisplay } from "@/components/logs-viewer/error-display/error-display";
import { LiveLogLine } from "@/components/logs-viewer/live-log-line/live-log-line";
import { LoadingSpinner } from "@/components/logs-viewer/loading-spinner/loading-spinner";
import { LogEntryRow } from "@/components/logs-viewer/log-entry-row/log-entry-row";
import { LogTabButton } from "@/components/logs-viewer/log-tab-button/log-tab-button";
import { PageShell } from "@/components/page-shell/page-shell";

import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

import type { ConnectionStatus } from "@/components/logs-viewer/connection-status-indicator/connection-status-indicator";
import type { LogEntryRowProps } from "@/components/logs-viewer/log-entry-row/log-entry-row";

export function LogsPage() {
  const logStore = {
    reconnect() {
      /* empty */
    },
    fetchHistoricalLogs() {
      /* empty */
    },
  };
  const error = "" as string;
  const connectionStatus: ConnectionStatus = "connecting";
  const reconnectAttempts = 0 as number;
  const maxReconnectAttempts = 3 as number;
  const logs: string[] = [];
  const historicalLogs: LogEntryRowProps["log"][] = [];
  const isLoadingHistorical = false as boolean;
  const hasConnected = false as boolean;
  const historicalError = "" as string;

  const [activeTab, setActiveTab] = useState<string>("live");

  // oxlint-disable-next-line unicorn/consistent-function-scoping
  function handleUploadLogs() {
    // Implement the logic for uploading logs here
  }

  function renderLiveTab() {
    if (logs.length > 0) {
      return (
        <>
          {logs.toReversed().map((line, i) => (
            <LiveLogLine key={`${i.toString()}:${line}`} line={line} />
          ))}
        </>
      );
    }

    if (connectionStatus === "connecting") {
      return (
        <LoadingSpinner
          message={getConnectionStatusText(
            connectionStatus,
            reconnectAttempts,
            maxReconnectAttempts,
          )}
        />
      );
    }

    if (connectionStatus === "connected" || hasConnected) {
      return <EmptyState message="Connected. Waiting for live logs..." />;
    }

    if (error) {
      return (
        <div className="p-8">
          <ErrorDisplay
            errorMessage={error}
            retryAction={() => {
              logStore.reconnect();
            }}
            buttonText="Reconnect"
          />
        </div>
      );
    }

    return null;
  }

  function renderHistoricalTab() {
    if (isLoadingHistorical) {
      return <LoadingSpinner message="Loading historical logs..." />;
    }

    if (historicalError) {
      return (
        <div className="p-8">
          <ErrorDisplay
            errorMessage={historicalError}
            retryAction={() => {
              logStore.fetchHistoricalLogs();
            }}
          />
        </div>
      );
    }

    if (historicalLogs.length > 0) {
      return (
        <>
          {historicalLogs.toReversed().map((log) => (
            <LogEntryRow
              key={`${String(log.timestamp)}:${String(log.message)}`}
              log={log}
            />
          ))}
        </>
      );
    }

    return <EmptyState message="No historical logs found" />;
  }

  function renderContent() {
    return (
      <ErrorBoundary
        // oxlint-disable-next-line react/no-unstable-nested-components
        fallbackRender={(props) => (
          <div className="bg-destructive/10 border-destructive/20 rounded-lg border p-6">
            <h3 className="text-destructive mb-3 text-lg font-semibold">
              Connection Failed
            </h3>
            <pre className="text-destructive/80 bg-destructive/5 mb-4 overflow-x-auto rounded border p-3 font-mono text-sm">
              {String(props.error)}
            </pre>
            <button
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-2 font-medium transition-colors"
              onClick={() => {
                props.resetErrorBoundary();
              }}
              type="button"
            >
              Try Again
            </button>
          </div>
        )}
      >
        <Suspense
          fallback={
            <div className="flex h-full flex-col items-center justify-center">
              <div className="bg-card max-w-md rounded-lg border p-8 text-center shadow-sm">
                <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-t-transparent" />
                <h3 className="mb-2 text-lg font-semibold">
                  Connecting to Logs
                </h3>
                <p className="text-muted-foreground text-sm">
                  Establishing connection to log server...
                </p>
              </div>
            </div>
          }
        >
          <div className="flex h-full min-h-0 flex-col">
            <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  System Logs
                </h1>
                <p className="text-muted-foreground mt-1">
                  System monitoring and logs
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="secondary"
                  onClick={handleUploadLogs}
                  type="button"
                >
                  Upload Logs
                </Button>
                <div className="bg-primary/10 text-primary border-primary/20 rounded-lg border px-4 py-2 font-medium">
                  {activeTab === "live" ? logs.length : historicalLogs.length}{" "}
                  entries
                </div>
              </div>
            </div>
            <Tabs
              defaultValue={activeTab}
              className="bg-card flex min-h-0 flex-1 flex-col rounded-lg border shadow-sm"
              onValueChange={(tab) => {
                setActiveTab(tab);
              }}
            >
              <TabsList
                className="w-full bg-muted/30 flex shrink-0 flex-col items-center justify-between gap-4 border-b px-6 py-3 md:flex-row"
                variant="line"
              >
                <div className="flex items-center gap-2">
                  <TabsTrigger name="Live Logs" value="live" asChild>
                    <LogTabButton name="Live Logs" />
                  </TabsTrigger>
                  <TabsTrigger
                    name="Historical Logs"
                    value="historical"
                    asChild
                  >
                    <LogTabButton name="Historical Logs" />
                  </TabsTrigger>
                </div>
                <div className="flex items-center gap-4">
                  <TabsContent value="live">
                    <ConnectionStatusIndicator
                      connectionStatus={connectionStatus}
                      reconnectAttempts={reconnectAttempts}
                      maxReconnectAttempts={maxReconnectAttempts}
                    />
                    {connectionStatus === "error" &&
                      reconnectAttempts < maxReconnectAttempts && (
                        <button
                          className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 rounded border px-3 py-1 text-sm font-medium transition-colors"
                          onClick={() => {
                            logStore.reconnect();
                          }}
                          type="button"
                        >
                          Reconnect Now
                        </button>
                      )}
                  </TabsContent>
                  <TabsContent value="historical">
                    <button
                      className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 rounded border px-3 py-1 text-sm font-medium transition-colors"
                      onClick={() => {
                        logStore.fetchHistoricalLogs();
                      }}
                      disabled={isLoadingHistorical}
                      type="button"
                    >
                      {isLoadingHistorical ? "Loading..." : "Refresh"}
                    </button>
                  </TabsContent>
                </div>
              </TabsList>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <TabsContent value="live">{renderLiveTab()}</TabsContent>
                <TabsContent value="historical">
                  {renderHistoricalTab()}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </Suspense>
      </ErrorBoundary>
    );
  }

  return <PageShell className="h-full">{renderContent()}</PageShell>;
}
