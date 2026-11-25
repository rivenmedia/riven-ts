import { journeyFixtures } from "@repo/util-e2e";

import { expect, test } from "#playwright/integrated-fixtures.ts";
import { saveSettingsAndReload } from "#playwright/save-settings-and-reload.ts";
import { waitForHydration } from "#playwright/wait-for-hydration.ts";

import type { Page } from "@playwright/test";

const { customProfile, newProfile } = journeyFixtures.settings;

test.use({ scenario: "e2e-settings", signedInAs: "admin" });

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

test.describe("the general settings", () => {
  test("saving keeps the changed settings", async ({ page }) => {
    await page.goto("/settings/general");

    // The log directory is set by Riven's environment, so it can't be changed
    const dubbedAnimeOnly = page.getByRole("switch", {
      name: "Dubbed anime only",
    });

    await waitForHydration(dubbedAnimeOnly);
    await dubbedAnimeOnly.click();
    await saveSettingsAndReload(page);

    await expect(dubbedAnimeOnly).toBeChecked();
  });

  test("shows the problems Riven finds with the changes", async ({ page }) => {
    await page.goto("/settings/general");

    // Riven allows at most 10 failed scrape attempts
    const attempts = page.getByRole("spinbutton", {
      name: "Maximum failed attempts",
    });

    await waitForHydration(attempts);
    await attempts.fill("11");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Too big")).toBeVisible();
  });
});

// These two share one worker, in order: the second checks the reset undid the first
test.describe("the plugin toggles", () => {
  test.describe.configure({ mode: "default" });

  test("disabling a plugin keeps it disabled", async ({ page }) => {
    await page.goto("/settings/plugins");

    await expect(page).toHaveURL("/settings/plugins/repo-plugin-comet");

    const cometSwitch = page.getByRole("switch", { name: "Enable Comet" });

    await expect(cometSwitch).toBeChecked();
    await waitForHydration(cometSwitch);

    await cometSwitch.click();

    await expect(cometSwitch).not.toBeChecked();

    // The switch updates optimistically, so wait for Riven to say a restart is required before reloading
    await expect(page.getByText("Restart Riven to apply them")).toBeVisible();

    await page.reload();

    await expect(cometSwitch).not.toBeChecked();
  });

  test("a disabled plugin is enabled again in the next test", async ({
    page,
  }) => {
    await page.goto("/settings/plugins/repo-plugin-comet");

    await expect(
      page.getByRole("switch", { name: "Enable Comet" }),
    ).toBeChecked();
    // The banner streams in after the page, and the document only completes once the stream has ended
    await expect
      .poll(() => page.evaluate(() => document.readyState))
      .toBe("complete");
    await expect(page.getByText("Restart Riven to apply them")).toHaveCount(0);
  });
});

test.describe("the ranking profiles", () => {
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
    await name.fill(newProfile.name);
    await page
      .getByRole("textbox", { name: "Description" })
      .fill(newProfile.description);
    await page.getByRole("button", { name: "Create profile" }).click();

    await expect(page.getByText("Ranking profile created.")).toBeVisible();
    await expect(page).toHaveURL("/settings/ranking");
    await expect(getProfileCard(page, newProfile.name)).toContainText(
      newProfile.description,
    );
  });

  test("editing a profile saves its changes", async ({ page }) => {
    await page.goto("/settings/ranking");

    await getProfileCard(page, customProfile.name)
      .getByRole("link", { name: "Edit" })
      .click();

    await expect(page).toHaveURL(/\/settings\/ranking\/profile\/[\w-]+$/u);
    await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue(
      customProfile.name,
    );

    const description = page.getByRole("textbox", { name: "Description" });
    const updatedDescription = "Tuned for 4K releases.";

    await waitForHydration(description);
    await description.fill(updatedDescription);
    await page.getByRole("button", { name: "Save profile" }).click();

    await expect(page.getByText("Ranking profile saved.")).toBeVisible();
    await expect(page).toHaveURL("/settings/ranking");
    await expect(getProfileCard(page, customProfile.name)).toContainText(
      updatedDescription,
    );
  });
});
