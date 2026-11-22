import { expect } from "@playwright/test";

import type { Page } from "@playwright/test";

/** Saves the settings, then reloads the page, so it shows what Riven stored */
export const saveSettingsAndReload = async (page: Page) => {
  await page.getByRole("button", { name: "Save" }).click();

  await expect(
    page.getByText("Settings saved. Restart Riven to apply them."),
  ).toBeVisible();

  await page.reload();
};
