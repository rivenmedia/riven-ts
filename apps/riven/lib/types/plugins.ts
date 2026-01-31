import type { DataSourceMap, RivenPlugin } from "@repo/util-plugin-sdk";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";
import type { Queue, Worker } from "bullmq";

export type PluginQueueMap = Map<symbol, Map<RivenEvent["type"], Queue>>;

export type PluginWorkerMap = Map<symbol, Map<RivenEvent["type"], Worker>>;

export type PublishableEventSet = Set<RivenEvent["type"]>;

export type RegisteredPlugin = {
  status: string;
  config: RivenPlugin;
  dataSources: DataSourceMap;
} & (
  | { status: "registered" }
  | { status: "valid" }
  | {
      status: "invalid";
      error: unknown;
    }
);
export type RegisteredPluginMap = Map<symbol, RegisteredPlugin>;

export type ValidatingPlugin = Extract<
  RegisteredPlugin,
  { status: "validating" }
>;

export type PendingPlugin = Extract<RegisteredPlugin, { status: "registered" }>;
export type PendingPluginMap = Map<symbol, PendingPlugin>;

export type ValidPlugin = Extract<RegisteredPlugin, { status: "valid" }>;
export type ValidPluginMap = Map<symbol, ValidPlugin>;

export type InvalidPlugin = Extract<RegisteredPlugin, { status: "invalid" }>;
export type InvalidPluginMap = Map<symbol, InvalidPlugin>;
