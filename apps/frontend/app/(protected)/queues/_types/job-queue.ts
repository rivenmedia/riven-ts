import type { ConnectionStatus } from "#components/connection-status-indicator/connection-status-indicator.tsx";
import type { JobState } from "../_utilities/job-states.ts";
import type { Route } from "next";

export type JobCounts = Readonly<Record<JobState, number>>;

interface QueueSummaryBase {
  name: string;
  isPaused: boolean;
  counts: JobCounts;
}

export interface FlowQueueSummary extends QueueSummaryBase {
  kind: "flow";
}

export interface SandboxedQueueSummary extends QueueSummaryBase {
  kind: "sandboxed";
}

export interface PluginQueueSummary extends QueueSummaryBase {
  kind: "plugin";
  plugin: { id: string; displayName: string };
}

export type QueueSummary =
  | FlowQueueSummary
  | SandboxedQueueSummary
  | PluginQueueSummary;

export interface JobMediaItem {
  title: string;
  subtitle?: string;
  detailsPath: Route;
}

export interface JobSummary {
  id: string;
  /** The BullMQ job name. */
  name: string;
  queueName: string;
  state: JobState;
  mediaItem?: JobMediaItem;
  attemptsMade: number;
  maxAttempts: number;
  /** ISO 8601. */
  createdAt: string;
  /** ISO 8601. */
  processedAt?: string;
  /** ISO 8601. */
  finishedAt?: string;
  /** ISO 8601. Delayed jobs only. */
  runAt?: string;
  /** Delayed jobs only. */
  delayReason?: "retry-backoff" | "scheduled";
  /** 0-100. Active jobs only. */
  progress?: number;
  /** Failed jobs only. */
  failedReason?: string;
  /** Waiting-children jobs only. */
  children?: { completed: number; total: number };
  /** Set for every job inside a flow; absent means top-level. */
  parent?: { id: string; queueName: string };
}

export interface FlowNode {
  id: string;
  queueName: string;
  state: JobState;
  failureIgnoredByParent?: boolean;
  children: readonly FlowNode[];
}

export interface JobDetail extends JobSummary {
  stacktrace: readonly string[];
  logs: readonly string[];
  data: unknown;
  returnValue?: unknown;
  flow: FlowNode;
}

export interface JobPage {
  jobs: readonly JobSummary[];
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
}

export interface LiveStatus {
  connectionStatus: ConnectionStatus;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  /** ISO 8601. */
  lastUpdatedAt: string;
}
