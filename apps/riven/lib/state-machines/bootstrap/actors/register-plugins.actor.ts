import {
  DataSourceMap,
  type RivenPlugin,
  parsePluginsFromDependencies,
} from "@repo/util-plugin-sdk";

import "reflect-metadata";
import { type ActorRefFromLogic, fromPromise } from "xstate";

import packageJson from "../../../../package.json" with { type: "json" };
import { pluginMachine } from "../../plugin/index.ts";

export interface RegisteredPlugin {
  config: RivenPlugin;
  dataSources: DataSourceMap;
  machine: typeof pluginMachine;
  ref: ActorRefFromLogic<typeof pluginMachine>;
}

export const registerPlugins = fromPromise<
  Map<symbol, Omit<RegisteredPlugin, "ref" | "dataSources">>
>(async () => {
  const plugins = await parsePluginsFromDependencies(
    packageJson.dependencies,
    import.meta.resolve.bind(null),
  );

  const pluginMap = new Map<
    symbol,
    Omit<RegisteredPlugin, "ref" | "dataSources">
  >();

  for (const plugin of plugins) {
    const machine = pluginMachine.provide({
      actors: {
        pluginRunner: plugin.runner,
        validatePlugin: plugin.validator,
      },
    });

    pluginMap.set(plugin.name, {
      config: plugin,
      machine,
    });
  }

  return pluginMap;
});
