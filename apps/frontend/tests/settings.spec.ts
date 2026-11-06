import assert from "node:assert";

import { INSTANCE_RESTART_STATUS } from "#app/(protected)/settings/_components/restart-banner/_queries/instance-restart-status.query.ts";
import { SETTINGS_SECTION } from "#app/(protected)/settings/_components/settings-section/_queries/settings-section.query.ts";
import { SETTINGS_PLUGINS } from "#app/(protected)/settings/plugins/_queries/settings-plugins.query.ts";
import { GET_INSTANCE_SETUP_REQUIRED } from "#app/_queries/get-instance-setup-required.query.ts";
import { api } from "#mocks/graphql.ts";
import { createHasPermissionHandler } from "#mocks/handlers/has-permission.handler.ts";
import { HttpResponse, expect, test } from "#playwright/fixtures.ts";

import type { InstanceRestartStatusQuery } from "#app/(protected)/settings/_components/restart-banner/_queries/instance-restart-status.query.typegen.ts";
import type { SettingsSectionQuery } from "#app/(protected)/settings/_components/settings-section/_queries/settings-section.query.typegen.ts";
import type { SettingsPluginsQuery } from "#app/(protected)/settings/plugins/_queries/settings-plugins.query.typegen.ts";
import type { GetInstanceSetupRequiredQuery } from "#app/_queries/get-instance-setup-required.query.typegen.ts";

const settingsPluginsRequests: unknown[] = [];

test.use({
  mswHandlers: async ({ mswHandlers }, use) =>
    use([
      ...mswHandlers,
      createHasPermissionHandler({ instance: ["manage-settings"] }),
      api.query(GET_INSTANCE_SETUP_REQUIRED, () =>
        HttpResponse.json({
          data: {
            instanceStatus: {
              __typename: "InstanceStatus",
              setupRequired: false,
            },
          } satisfies GetInstanceSetupRequiredQuery,
        }),
      ),
      api.query(INSTANCE_RESTART_STATUS, () =>
        HttpResponse.json({
          data: {
            instanceStatus: {
              __typename: "InstanceStatus",
              restartRequired: false,
            },
          } satisfies InstanceRestartStatusQuery,
        }),
      ),
      api.query(SETTINGS_SECTION, ({ variables }) =>
        HttpResponse.json({
          data: {
            settingsSection: {
              __typename: "SettingsSection",
              id: variables.id,
              title: "General",
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
      api.query(SETTINGS_PLUGINS, ({ variables }) => {
        settingsPluginsRequests.push(variables);

        return HttpResponse.json({
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
        });
      }),
    ]),
});

test.beforeEach(async ({ authHelpers, adminUser, context }) => {
  settingsPluginsRequests.length = 0;

  const [cookie] = await authHelpers.getCookies({ userId: adminUser.id });

  assert.ok(cookie);

  await context.addCookies([
    { ...cookie, domain: "localhost" },
    {
      name: "user_role",
      path: "/",
      value: adminUser.role,
      domain: "localhost",
    },
  ]);
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

test("the general settings don't load the plugin list", async ({ page }) => {
  await page.goto("/settings/general");

  await expect(
    page.getByRole("textbox", { name: "Log Directory" }),
  ).toBeVisible();

  expect(settingsPluginsRequests).toHaveLength(0);
});
