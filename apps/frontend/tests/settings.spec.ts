import { SETTINGS_SECTION } from "#app/(protected)/settings/_components/settings-section/_queries/settings-section.query.ts";
import { SETTINGS_PLUGINS } from "#app/(protected)/settings/plugins/_queries/settings-plugins.query.ts";
import { api } from "#mocks/graphql.ts";
import {
  HttpResponse,
  expect,
  test,
  withHandlers,
} from "#playwright/fixtures.ts";

import type { SettingsSectionQuery } from "#app/(protected)/settings/_components/settings-section/_queries/settings-section.query.typegen.ts";
import type { SettingsPluginsQuery } from "#app/(protected)/settings/plugins/_queries/settings-plugins.query.typegen.ts";

test.use({
  signedInAs: "admin",
  handlers: withHandlers(
    api.query(SETTINGS_SECTION, ({ variables }) =>
      HttpResponse.json({
        data: {
          settingsSection: {
            __typename: "SettingsSection",
            id: variables.id,
            title: "General",
            appliesImmediately: false,
            jsonSchema: {
              type: "object",
              properties: {
                logDirectory: {
                  type: "string",
                  title: "Log Directory",
                  default: "./logs",
                },
              },
            },
            values: { logDirectory: "./logs" },
            lockedFields: [],
            secretStates: [],
            issues: [],
          },
        } satisfies SettingsSectionQuery,
      }),
    ),
    api.query(SETTINGS_PLUGINS, () =>
      HttpResponse.json({
        data: {
          settingsPlugins: {
            __typename: "PluginList",
            enabledPluginsLocked: false,
            plugins: [
              {
                __typename: "PluginSummary",
                id: "repo-plugin-comet",
                title: "Comet",
                enabled: true,
                alwaysEnabled: false,
              },
            ],
          },
        } satisfies SettingsPluginsQuery,
      }),
    ),
  ),
});

test("visiting the settings page lands on the general settings", async ({
  page,
}) => {
  await page.goto("/settings");

  await expect(page).toHaveURL("/settings/general");
  await expect(
    page.getByRole("tab", { name: "General", selected: true }),
  ).toBeVisible();
});

test("an unknown plugin shows the not found page", async ({ page }) => {
  await page.goto("/settings/plugins/does-not-exist");

  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
});

test("the general settings don't load the plugin list", async ({
  page,
  recordOperation,
}) => {
  const settingsPluginsRequests = recordOperation(SETTINGS_PLUGINS);

  await page.goto("/settings/general");

  await expect(
    page.getByRole("textbox", { name: "Log Directory" }),
  ).toBeVisible();

  expect(settingsPluginsRequests).toHaveLength(0);
});
