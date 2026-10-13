import type { RivenPluginUi } from "@repo/util-plugin-sdk/ui";

type PluginUiLoader = () => Promise<{ ui: RivenPluginUi }>;

/**
 * Plugins that provide UI, keyed by plugin name (e.g. `tmdb` for `@repo/plugin-tmdb`).
 *
 * Each entry must import its plugin's `./ui` entry point with a static string,
 * so NextJS can bundle the plugin's pages. Plugins listed here must also be dependencies of the frontend.
 *
 * @example
 * export const pluginUiRegistry: PluginUiRegistry = {
 *   tmdb: async () => import("@repo/plugin-tmdb/ui"),
 * };
 */
export type PluginUiRegistry = Readonly<Record<string, PluginUiLoader>>;

export const pluginUiRegistry: PluginUiRegistry = {};
