import "reflect-metadata";

import packageJson from "../../../../package.json" with { type: "json" };
import { pluginMachine } from "../../plugin/index.ts";
import { fromPromise, type ActorRef, type Snapshot } from "xstate";
import {
  DataSourceMap,
  parsePluginsFromDependencies,
  type PluginToProgramEvent,
  type ProgramToPluginEvent,
} from "@repo/util-plugin-sdk";
import type { KeyvAdapter } from "@apollo/utils.keyvadapter";
import { logger } from "@repo/core-util-logger";

export type PluginRef = ActorRef<
  Snapshot<unknown>,
  ProgramToPluginEvent,
  PluginToProgramEvent
>;

export interface RegisteredPlugin {
  dataSources: DataSourceMap;
  machine: typeof pluginMachine;
  ref: PluginRef | null;
}

export interface RegisterPluginsInput {
  cache: KeyvAdapter;
}

export const registerPlugins = fromPromise<
  Map<symbol, RegisteredPlugin>,
  RegisterPluginsInput
>(async ({ input: { cache } }) => {
  const plugins = await parsePluginsFromDependencies(
    packageJson.dependencies,
    import.meta.resolve.bind(null),
  );

  const pluginMap = new Map<symbol, RegisteredPlugin>();
  const dataSourceMap = new DataSourceMap();

  for (const plugin of plugins) {
    if (plugin.dataSources) {
      for (const DataSourceConstructor of plugin.dataSources) {
        const instance = new DataSourceConstructor({
          cache,
        });

        // TODO: Move validation to plugin machine
        try {
          instance.token = await instance.getApiToken();
        } catch (error) {
          logger.error(
            `Failed to get API token for data source ${instance.serviceName}: ${
              (error as Error).message
            }`,
          );
        }

        dataSourceMap.set(DataSourceConstructor, instance);
      }
    }

    const machine = pluginMachine.provide({
      actors: {
        plugin: plugin.runner,
      },
    });

    pluginMap.set(plugin.name, {
      dataSources: dataSourceMap,
      machine,
      ref: null,
    });
  }

  return pluginMap;
});
