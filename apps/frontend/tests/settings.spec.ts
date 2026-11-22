import { SETTINGS_PLUGINS } from "#app/(protected)/settings/plugins/_queries/settings-plugins.query.ts";
import { logDirectorySettingsSectionHandler } from "#mocks/handlers/settings-section.handler.ts";
import { expect, test, withHandlers } from "#playwright/fixtures.ts";

test.use({
  signedInAs: "admin",
  handlers: withHandlers(logDirectorySettingsSectionHandler),
});

// Asserts on a request the frontend must not make, which needs the mocked network
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
