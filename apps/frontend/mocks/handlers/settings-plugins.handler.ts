import { HttpResponse } from "msw";

import { SET_PLUGIN_ENABLED } from "#app/(protected)/settings/plugins/_mutations/set-plugin-enabled.mutation.ts";
import { SETTINGS_PLUGINS } from "#app/(protected)/settings/plugins/_queries/settings-plugins.query.ts";
import { api } from "#mocks/graphql.ts";

import type { SettingsPluginsQuery } from "#app/(protected)/settings/plugins/_queries/settings-plugins.query.typegen.ts";

type PluginSummary = SettingsPluginsQuery["settingsPlugins"]["plugins"][number];

/**
 * Mocks the plugins in the settings, keeping each plugin's enabled state as it's changed.
 */
export const createSettingsPluginsStore = (initialPlugins: PluginSummary[]) => {
  const plugins = initialPlugins.map((plugin) => ({ ...plugin }));

  return {
    plugins,
    handlers: [
      api.query(SETTINGS_PLUGINS, () =>
        HttpResponse.json({
          data: {
            settingsPlugins: {
              __typename: "PluginList",
              enabledPluginsLocked: false,
              plugins,
            },
          } satisfies SettingsPluginsQuery,
        }),
      ),
      api.mutation(SET_PLUGIN_ENABLED, ({ variables: { id, enabled } }) => {
        const plugin = plugins.find((candidate) => candidate.id === id);

        if (plugin) {
          plugin.enabled = enabled;
        }

        return HttpResponse.json({
          data: {
            setPluginEnabled: {
              __typename: "SettingsMutationResult",
              success: Boolean(plugin),
              issues: [],
            },
          },
        });
      }),
    ],
  };
};
