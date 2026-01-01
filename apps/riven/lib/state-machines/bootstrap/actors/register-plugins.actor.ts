import { logger } from "@repo/core-util-logger";
import {
  DataSourceMap,
  parsePluginsFromDependencies,
} from "@repo/util-plugin-sdk";

import type { KeyvAdapter } from "@apollo/utils.keyvadapter";
import "reflect-metadata";
import {
  type ActorRefFromLogic,
  createActor,
  fromPromise,
  spawnChild,
  toPromise,
} from "xstate";

import packageJson from "../../../../package.json" with { type: "json" };
import { pluginMachine } from "../../plugin/index.ts";
import { rateLimitedFetchMachine } from "../../rate-limited-fetch/index.ts";

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
>(async ({ input: { cache }, signal }) => {
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
          const token = await DataSource.getApiToken({ signal });
          const instance = new DataSource({
            cache,
            token,
            fetch: async (url, options) => {
              const actor = createActor(rateLimitedFetchMachine, {
                input: {
                  url,
                  fetchOpts: options,
                },
              });

              actor.start();
              actor.send({ type: "fetch" });

              return toPromise(actor);
            },
            logger,
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
