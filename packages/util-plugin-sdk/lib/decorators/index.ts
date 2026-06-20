import { createParameterDecorator } from "type-graphql";

import {
  type DataSourceConstructor,
  isBasePluginContext,
} from "../schemas/index.ts";

import type { GraphQLContext } from "../types/graphql-context.ts";

/**
 * Parameter decorator used to inject the plugin context for the current plugin.
 *
 * @param pluginSymbol The plugin name, as found in the config
 * @returns The context available to the current plugin
 */
export function PluginContext(pluginSymbol: symbol) {
  return createParameterDecorator<GraphQLContext>(({ context }) =>
    context.plugins.get(pluginSymbol),
  );
}

/**
 * Parameter decorator used to inject a data source instance for the current plugin.
 *
 * @param pluginSymbol The plugin name, as found in the config
 * @param dataSource The data source to return
 * @returns The requested data source instance
 */
export function PluginDataSource(
  pluginSymbol: symbol,
  dataSource: DataSourceConstructor,
) {
  return createParameterDecorator<GraphQLContext>(({ context }) => {
    const pluginContext = context.plugins.get(pluginSymbol);

    if (!isBasePluginContext(pluginContext)) {
      throw new Error(
        `Invalid plugin context for plugin with symbol ${String(pluginSymbol)}`,
      );
    }

    return pluginContext.dataSources.get(dataSource);
  });
}
