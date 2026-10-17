import { matchPluginRoute } from "./match-plugin-route.ts";
import { pluginUiRegistry } from "./plugin-ui-registry.ts";

import type { PluginUiRegistry } from "./plugin-ui-registry.ts";

/**
 * Finds the plugin page to render for a URL under `/plugin/{pluginName}`.
 *
 * @returns The matched page and its params, or `undefined` if the plugin or route doesn't exist.
 */
export async function resolvePluginPage(
  pluginName: string,
  segments: readonly string[],
  registry: PluginUiRegistry = pluginUiRegistry,
) {
  const loadPluginUi = Object.hasOwn(registry, pluginName)
    ? registry[pluginName]
    : undefined;

  if (!loadPluginUi) {
    return;
  }

  const { ui } = await loadPluginUi();

  return matchPluginRoute(ui.pages, segments);
}
