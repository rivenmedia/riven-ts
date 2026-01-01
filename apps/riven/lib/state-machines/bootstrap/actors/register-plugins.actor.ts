import "reflect-metadata";

import packageJson from "../../../../package.json" with { type: "json" };
import { pluginMachine } from "../../plugin/index.ts";
import { fromPromise, type ActorRefFromLogic } from "xstate";
import {
  DataSourceMap,
  parsePluginsFromDependencies,
} from "@repo/util-plugin-sdk";
import type { KeyvAdapter } from "@apollo/utils.keyvadapter";
import { logger } from "@repo/core-util-logger";

export interface RegisteredPlugin {
  dataSources: DataSourceMap;
  machine: typeof pluginMachine;
  ref: ActorRefFromLogic<typeof pluginMachine>;
}

export interface RegisterPluginsInput {
  cache: KeyvAdapter;
}

export const registerPlugins = fromPromise<
  Map<symbol, Omit<RegisteredPlugin, "ref">>,
  RegisterPluginsInput
>(async ({ input: { cache } }) => {
  const plugins = await parsePluginsFromDependencies(
    packageJson.dependencies,
    import.meta.resolve.bind(null),
  );

  const pluginMap = new Map<symbol, Omit<RegisteredPlugin, "ref">>();

  for (const plugin of plugins) {
    const dataSourceMap = new DataSourceMap();

    if (plugin.dataSources) {
      for (const DataSource of plugin.dataSources) {
        try {
          const token = await DataSource.getApiToken();
          const instance = new DataSource({
            cache,
            token,
          });

          dataSourceMap.set(DataSource, instance);
        } catch (error) {
          logger.error(
            `Failed to construct data source ${DataSource.name} for ${plugin.name.toString()}: ${
              (error as Error).message
            }`,
          );
        }
      }
    }

    const machine = pluginMachine.provide({
      actors: {
        pluginRunner: plugin.runner,
        validatePlugin: plugin.validator,
      },
    });

    pluginMap.set(plugin.name, {
      dataSources: dataSourceMap,
      machine,
    });
  }

  return pluginMap;
});
