import {
  DataSourceMap,
  type RivenPlugin,
  type createPluginRunner,
  parsePluginsFromDependencies,
} from "@repo/util-plugin-sdk";

import "reflect-metadata";
import { type ActorRefFromLogic, fromPromise } from "xstate";

import packageJson from "../../../../package.json" with { type: "json" };

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
  | { status: "invalid" }
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

// export interface RegisteredPlugin {
//   config: RivenPlugin;
//   dataSources: DataSourceMap;
//   isValidating: boolean;
// }

// export interface ValidatingPlugin extends RegisteredPlugin {
//   isValidating: true;
//   runnerRef?: never;
// }

// export interface ValidPlugin extends RegisteredPlugin {
//   isInvalid: false;
//   isValidating: false;
//   runnerRef: ActorRefFromLogic<ReturnType<typeof createPluginRunner>>;
// }

// export interface InvalidPlugin extends RegisteredPlugin {
//   isInvalid: true;
//   isValidating: false;
//   runnerRef?: never;
// }

export const registerPlugins = fromPromise<RivenPlugin[]>(async () => {
  return await parsePluginsFromDependencies(
    packageJson.dependencies,
    import.meta.resolve.bind(null),
  );
});
