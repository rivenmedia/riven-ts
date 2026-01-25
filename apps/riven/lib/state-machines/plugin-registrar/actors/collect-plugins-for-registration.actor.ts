import {
  DataSourceMap,
  type ParsedPlugins,
  type RivenPlugin,
  parsePluginsFromDependencies,
} from "@repo/util-plugin-sdk";

import "reflect-metadata";
import { fromPromise } from "xstate";

import packageJson from "../../../../package.json" with { type: "json" };

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

export type ValidatingPlugin = Extract<
  RegisteredPlugin,
  { status: "validating" }
>;

export type ValidPlugin = Extract<RegisteredPlugin, { status: "valid" }>;

export type InvalidPlugin = Extract<RegisteredPlugin, { status: "invalid" }>;

export const collectPluginsForRegistration = fromPromise<ParsedPlugins>(
  async () => {
    return await parsePluginsFromDependencies(
      packageJson.dependencies,
      import.meta.resolve.bind(null),
    );
  },
);
