import { logDirectorySettingsSectionHandler } from "#mocks/handlers/settings-section.handler.ts";
import { expect, http, test, withHandlers } from "#playwright/fixtures.ts";
import { waitForHydration } from "#playwright/wait-for-hydration.ts";

import type { UserRole } from "@repo/util-auth/access-control";

// A protected page that renders without mocking its data, as unmocked requests elsewhere open Next.js' error overlay
const pageWithoutData = "/explore";

// The settings page loads its section even when the user isn't allowed to see it
test.use({ handlers: withHandlers(logDirectorySettingsSectionHandler) });

test.describe("when signed out", () => {
  for (const path of ["/", "/library", "/settings"] as const) {
    test(`visiting ${path} redirects to the login page`, async ({ page }) => {
      await page.goto(path);

      await expect(page).toHaveURL("/login");
      await expect(page.getByRole("tab", { name: "Login" })).toBeVisible();
    });
  }
});

test.describe("when signed in", () => {
  test.use({ signedInAs: "user" });

  test("visiting the login page redirects to the home page", async ({
    page,
  }) => {
    await page.goto("/login");

    await expect(page).toHaveURL("/");
  });

  test("logging out returns to the login page and ends the session", async ({
    auth,
    network,
    page,
  }) => {
    network.use(http.post("**/api/auth/sign-out", auth.signOut()));

    await page.goto(pageWithoutData);

    const logoutButton = page.getByRole("button", { name: "Logout" });

    await waitForHydration(logoutButton);
    await logoutButton.click();

    await expect(page).toHaveURL("/login");

    await page.goto("/library");

    await expect(page).toHaveURL("/login");
  });
});

test.describe("as an admin", () => {
  test.use({ signedInAs: "admin" });

  test("the settings are linked from the sidebar", async ({ page }) => {
    await page.goto(pageWithoutData);

    await page.getByRole("link", { name: "Settings" }).click();

    await expect(page).toHaveURL("/settings/general");
  });
});

for (const role of ["manager", "user"] as const satisfies UserRole[]) {
  test.describe(`as a ${role}`, () => {
    test.use({ signedInAs: role });

    test("the settings aren't linked from the sidebar", async ({ page }) => {
      await page.goto(pageWithoutData);

      await expect(
        page.getByRole("navigation", { name: "Main Navigation" }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "Settings" })).toBeHidden();
    });

    test("visiting the settings is unauthorized", async ({ page }) => {
      await page.goto("/settings/general");

      await expect(
        page.getByRole("heading", {
          name: "You're not authorized to access this page.",
        }),
      ).toBeVisible();
    });
  });
}
