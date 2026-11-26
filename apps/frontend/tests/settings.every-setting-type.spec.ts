import { createSettingsSectionStore } from "#mocks/handlers/settings-section.handler.ts";
import { expect, test } from "#playwright/fixtures.ts";
import { saveSettingsAndReload } from "#playwright/save-settings-and-reload.ts";
import { waitForHydration } from "#playwright/wait-for-hydration.ts";

test.use({ signedInAs: "admin" });

/** A settings section with a setting of every type */
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

  await saveSettingsAndReload(page);

  await expect(debugLogging).toBeChecked();
  await expect(page.getByRole("combobox", { name: "Log level" })).toHaveText(
    "debug",
  );
  await expect(page.getByText("HDR", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("spinbutton", { name: "Update interval" }),
  ).toHaveValue("120");
  await expect(page.getByRole("combobox", { name: "Dubbed only" })).toHaveText(
    "Yes",
  );
  // The secret was left blank, so it's still unset
  await expect(page.getByLabel("API key")).toHaveAttribute(
    "placeholder",
    "Not set",
  );
});

test("emptying a setting resets it, or saves it as null when it's nullable", async ({
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
  await saveSettingsAndReload(page);

  // Reset to its default, rather than left empty
  await expect(logDirectory).toHaveValue("./logs");
  // Saved as null, rather than reset to its default
  await expect(updateInterval).toHaveValue("");
});
