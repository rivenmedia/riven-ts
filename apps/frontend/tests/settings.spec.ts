import { UPDATE_SETTINGS_SECTION } from "#app/(protected)/settings/_components/settings-section/_mutations/update-settings-section.mutation.ts";
import { SETTINGS_PLUGINS } from "#app/(protected)/settings/plugins/_queries/settings-plugins.query.ts";
import {
  customProfile,
  defaultProfile,
} from "#app/(protected)/settings/ranking/_components/ranking-profiles.fixtures.ts";
import { api } from "#mocks/graphql.ts";
import {
  createRankingProfilesStore,
  rankingProfileSchemaHandler,
} from "#mocks/handlers/ranking-profiles.handler.ts";
import { createSettingsPluginsStore } from "#mocks/handlers/settings-plugins.handler.ts";
import {
  createSettingsSectionStore,
  logDirectorySettingsSectionHandler,
} from "#mocks/handlers/settings-section.handler.ts";
import {
  HttpResponse,
  expect,
  test,
  withHandlers,
} from "#playwright/fixtures.ts";
import { waitForHydration } from "#playwright/wait-for-hydration.ts";

import type { Page } from "@playwright/test";

test.use({
  signedInAs: "admin",
  handlers: withHandlers(
    logDirectorySettingsSectionHandler,
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
        },
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

/** Saves the settings, then reloads the page, so it shows what Riven stored */
async function saveAndReload(page: Page) {
  await page.getByRole("button", { name: "Save" }).click();

  await expect(
    page.getByText("Settings saved. Restart Riven to apply them."),
  ).toBeVisible();

  await page.reload();
}

test.describe("the general settings", () => {
  test("saving keeps the changed settings", async ({ network, page }) => {
    network.use(
      ...createSettingsSectionStore({
        properties: {
          logDirectory: {
            type: "string",
            title: "Log Directory",
            default: "./logs",
          },
        },
        values: { logDirectory: "./logs" },
      }).handlers,
    );

    await page.goto("/settings/general");

    const logDirectory = page.getByRole("textbox", { name: "Log Directory" });

    await waitForHydration(logDirectory);
    await logDirectory.fill("/var/log/riven");
    await saveAndReload(page);

    await expect(logDirectory).toHaveValue("/var/log/riven");
  });

  test("shows the problems Riven finds with the changes", async ({
    network,
    page,
  }) => {
    network.use(
      api.mutation(UPDATE_SETTINGS_SECTION, () =>
        HttpResponse.json({
          data: {
            updateSettingsSection: {
              __typename: "SettingsMutationResult",
              success: false,
              issues: [
                {
                  __typename: "SettingsIssue",
                  path: "logDirectory",
                  message: "Directory is not writable",
                },
              ],
            },
          },
        }),
      ),
    );

    await page.goto("/settings/general");

    const logDirectory = page.getByRole("textbox", { name: "Log Directory" });

    await waitForHydration(logDirectory);
    await logDirectory.fill("/root/logs");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Directory is not writable")).toBeVisible();
  });
});

test.describe("a settings section with every type of setting", () => {
  test.beforeEach(({ network }) => {
    network.use(
      ...createSettingsSectionStore({
        properties: {
          logDirectory: {
            type: "string",
            title: "Log Directory",
            default: "./logs",
          },
          debugLogging: {
            type: "boolean",
            title: "Debug logging",
            default: false,
          },
          logLevel: {
            type: "string",
            enum: ["info", "debug", "warning"],
            title: "Log level",
            default: "info",
          },
          excludedWords: {
            type: "array",
            items: { type: "string" },
            title: "Excluded words",
            default: [],
          },
          updateIntervalSeconds: {
            anyOf: [{ type: "integer", minimum: 0 }, { type: "null" }],
            title: "Update interval",
            default: 60,
          },
          dubbedOnly: {
            anyOf: [{ type: "boolean" }, { type: "null" }],
            title: "Dubbed only",
            default: null,
          },
          apiKey: { type: "string", title: "API key", secret: true },
        },
        values: {
          logDirectory: "/var/log/riven",
          excludedWords: ["CAM"],
          updateIntervalSeconds: 60,
        },
        secretStates: { apiKey: "unset" },
      }).handlers,
    );
  });

  test("saving keeps each edited setting", async ({ page }) => {
    await page.goto("/settings/general");

    const debugLogging = page.getByRole("switch", { name: "Debug logging" });

    await waitForHydration(debugLogging);
    await debugLogging.click();

    await page.getByRole("combobox", { name: "Log level" }).click();
    await page.getByRole("option", { name: "debug" }).click();

    const excludedWords = page.getByRole("combobox", {
      name: "Excluded words",
    });

    await excludedWords.click();
    await excludedWords.fill("HDR");
    await excludedWords.press("Enter");

    await page.getByRole("spinbutton", { name: "Update interval" }).fill("120");

    await page.getByRole("combobox", { name: "Dubbed only" }).click();
    await page.getByRole("option", { name: "Yes" }).click();

    await saveAndReload(page);

    await expect(debugLogging).toBeChecked();
    await expect(page.getByRole("combobox", { name: "Log level" })).toHaveText(
      "debug",
    );
    await expect(page.getByText("HDR", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("spinbutton", { name: "Update interval" }),
    ).toHaveValue("120");
    await expect(
      page.getByRole("combobox", { name: "Dubbed only" }),
    ).toHaveText("Yes");
    // The secret was left blank, so it's still unset
    await expect(page.getByLabel("API key")).toHaveAttribute(
      "placeholder",
      "Not set",
    );
  });

  test("emptying a setting resets it, or clears it when it's nullable", async ({
    page,
  }) => {
    await page.goto("/settings/general");

    const logDirectory = page.getByRole("textbox", { name: "Log Directory" });
    const updateInterval = page.getByRole("spinbutton", {
      name: "Update interval",
    });

    await waitForHydration(logDirectory);
    await logDirectory.clear();
    await updateInterval.clear();
    await saveAndReload(page);

    // Reset to its default, rather than left empty
    await expect(logDirectory).toHaveValue("./logs");
    // Saved as null, rather than reset to its default
    await expect(updateInterval).toHaveValue("");
  });
});

test("disabling a plugin keeps it disabled", async ({ network, page }) => {
  const pluginsStore = createSettingsPluginsStore([
    {
      __typename: "PluginSummary",
      id: "repo-plugin-comet",
      title: "Comet",
      enabled: true,
      alwaysEnabled: false,
    },
  ]);

  network.use(...pluginsStore.handlers);

  await page.goto("/settings/plugins");

  await expect(page).toHaveURL("/settings/plugins/repo-plugin-comet");

  const cometSwitch = page.getByRole("switch", { name: "Enable Comet" });

  await expect(cometSwitch).toBeChecked();
  await waitForHydration(cometSwitch);

  await cometSwitch.click();

  await expect(cometSwitch).not.toBeChecked();

  // The switch updates optimistically, so wait for Riven to disable the plugin before reloading
  await expect
    .poll(
      () =>
        pluginsStore.plugins.find(({ id }) => id === "repo-plugin-comet")
          ?.enabled,
    )
    .toBe(false);

  await page.reload();

  await expect(cometSwitch).not.toBeChecked();
});

test.describe("the ranking profiles", () => {
  test.beforeEach(({ network }) => {
    const profilesStore = createRankingProfilesStore([
      defaultProfile,
      customProfile,
    ]);

    network.use(rankingProfileSchemaHandler, ...profilesStore.handlers);
  });

  /** The card of the ranking profile with the given name */
  const getProfileCard = (page: Page, name: string) =>
    page.locator('[data-slot="card"]').filter({ hasText: name });

  test("creating a profile adds it to the custom profiles", async ({
    page,
  }) => {
    await page.goto("/settings/ranking");

    await page.getByRole("link", { name: "Create Custom Profile" }).click();

    const name = page.getByRole("textbox", { name: "Name" });

    await waitForHydration(name);
    await name.fill("Anime");
    await page
      .getByRole("textbox", { name: "Description" })
      .fill("Prefers dual audio releases.");
    await page.getByRole("button", { name: "Create profile" }).click();

    await expect(page.getByText("Ranking profile created.")).toBeVisible();
    await expect(page).toHaveURL("/settings/ranking");
    await expect(getProfileCard(page, "Anime")).toContainText(
      "Prefers dual audio releases.",
    );
  });

  test("editing a profile saves its changes", async ({ page }) => {
    await page.goto("/settings/ranking");

    await getProfileCard(page, customProfile.name)
      .getByRole("link", { name: "Edit" })
      .click();

    await expect(page).toHaveURL(
      `/settings/ranking/profile/${customProfile.id}`,
    );

    const description = page.getByRole("textbox", { name: "Description" });

    await waitForHydration(description);
    await description.fill("Tuned for 4K releases.");
    await page.getByRole("button", { name: "Save profile" }).click();

    await expect(page.getByText("Ranking profile saved.")).toBeVisible();
    await expect(page).toHaveURL("/settings/ranking");
    await expect(getProfileCard(page, customProfile.name)).toContainText(
      "Tuned for 4K releases.",
    );
  });
});
