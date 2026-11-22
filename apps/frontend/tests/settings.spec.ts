import { omit } from "es-toolkit";

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
  everySettingTypeSectionHandler,
  everySettingTypeSectionValues,
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

test.describe("the general settings", () => {
  test("saving sends the changed settings", async ({
    network,
    page,
    recordOperation,
  }) => {
    network.use(
      api.mutation(UPDATE_SETTINGS_SECTION, () =>
        HttpResponse.json({
          data: {
            updateSettingsSection: {
              __typename: "SettingsMutationResult",
              success: true,
              issues: [],
            },
          },
        }),
      ),
    );

    const updates = recordOperation(UPDATE_SETTINGS_SECTION);

    await page.goto("/settings/general");

    const logDirectory = page.getByRole("textbox", { name: "Log Directory" });

    await waitForHydration(logDirectory);
    await logDirectory.fill("/var/log/riven");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText("Settings saved. Restart Riven to apply them."),
    ).toBeVisible();

    expect(updates).toEqual([
      {
        id: "general",
        values: { logDirectory: "/var/log/riven" },
        reset: [],
      },
    ]);
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
      everySettingTypeSectionHandler,
      api.mutation(UPDATE_SETTINGS_SECTION, () =>
        HttpResponse.json({
          data: {
            updateSettingsSection: {
              __typename: "SettingsMutationResult",
              success: true,
              issues: [],
            },
          },
        }),
      ),
    );
  });

  test("saving sends each edited setting", async ({
    page,
    recordOperation,
  }) => {
    const updates = recordOperation(UPDATE_SETTINGS_SECTION);

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

    await page.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText("Settings saved. Restart Riven to apply them."),
    ).toBeVisible();

    // A blank secret is sent, which leaves it unchanged
    expect(updates).toEqual([
      {
        id: "general",
        values: {
          ...everySettingTypeSectionValues,
          debugLogging: true,
          logLevel: "debug",
          excludedWords: ["CAM", "HDR"],
          updateIntervalSeconds: 120,
          dubbedOnly: true,
          apiKey: "",
        },
        reset: [],
      },
    ]);
  });

  test("emptying a setting resets it, or saves null when it's nullable", async ({
    page,
    recordOperation,
  }) => {
    const updates = recordOperation(UPDATE_SETTINGS_SECTION);

    await page.goto("/settings/general");

    const logDirectory = page.getByRole("textbox", { name: "Log Directory" });

    await waitForHydration(logDirectory);
    await logDirectory.clear();
    await page.getByRole("spinbutton", { name: "Update interval" }).clear();
    await page.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText("Settings saved. Restart Riven to apply them."),
    ).toBeVisible();

    expect(updates).toEqual([
      {
        id: "general",
        values: {
          ...omit(everySettingTypeSectionValues, ["logDirectory"]),
          updateIntervalSeconds: null,
          apiKey: "",
        },
        reset: ["logDirectory"],
      },
    ]);
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
