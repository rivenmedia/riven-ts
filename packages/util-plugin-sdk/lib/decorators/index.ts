import { createParameterDecorator } from "type-graphql";

import {
  type DataSourceConstructor,
  isBasePluginContext,
} from "../schemas/index.ts";

/**
 * Parameter decorator used to inject the plugin context for the current plugin.
 *
 * @param pluginSymbol The plugin name, as found in the config
 * @returns The context available to the current plugin
 */
export function PluginContext(pluginSymbol: symbol) {
  return createParameterDecorator<Record<symbol, unknown>>(
    ({ context }) => context[pluginSymbol],
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataSource: DataSourceConstructor<any>,
) {
  return createParameterDecorator<Record<symbol, unknown>>(({ context }) => {
    const pluginContext = context[pluginSymbol];

    if (!isBasePluginContext(pluginContext)) {
      throw new Error(
        `Invalid plugin context for plugin with symbol ${String(pluginSymbol)}`,
      );
    }

    return pluginContext.dataSources.get(dataSource);
  });
}
