import {
  DataSourceMap,
  type ParsedPlugins,
  type RivenPlugin,
  type createPluginRunner,
  parsePluginsFromDependencies,
} from "@repo/util-plugin-sdk";

import "reflect-metadata";
import { type ActorRefFromLogic, fromPromise } from "xstate";

import packageJson from "../../../../../../package.json" with { type: "json" };

export type RegisteredPlugin = {
  status: string;
  config: RivenPlugin;
  dataSources: DataSourceMap;
} & (
  | { status: "registered" }
  | { status: "pending-runner-invocation" }
  | {
      status: "valid";
      runnerRef: ActorRefFromLogic<ReturnType<typeof createPluginRunner>>;
    }
  | {
      status: "invalid";
      error: unknown;
    }
);

export type ValidatingPlugin = Extract<
  RegisteredPlugin,
  { status: "validating" }
>;

export type ValidPlugin = Extract<RegisteredPlugin, { status: "valid" }>;

export type PendingRunnerInvocationPlugin = Extract<
  RegisteredPlugin,
  { status: "pending-runner-invocation" }
>;

export type InvalidPlugin = Extract<RegisteredPlugin, { status: "invalid" }>;

export const collectPluginsForRegistration = fromPromise<ParsedPlugins>(
  async () => {
    return await parsePluginsFromDependencies(
      packageJson.dependencies,
      import.meta.resolve.bind(null),
    );
  },
);
