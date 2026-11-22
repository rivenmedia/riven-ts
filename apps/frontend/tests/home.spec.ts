import { expect, test } from "#playwright/fixtures.ts";

test.use({ signedInAs: "user" });

// Stays mocked: Riven's recentlyAdded resolver is a stub that returns []
test("shows what's recently added", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("link", { name: "Arcane TV • 2024" }),
  ).toBeVisible();
});
