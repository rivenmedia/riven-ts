import { e2eUsers, expect, test } from "#playwright/integrated-fixtures.ts";
import { waitForHydration } from "#playwright/wait-for-hydration.ts";

import type { Page } from "@playwright/test";

const logIn = async (
  page: Page,
  { username, password }: { username: string; password: string },
) => {
  await page.goto("/login");

  const loginTab = page.getByRole("tab", { name: /login/iu });

  await waitForHydration(loginTab);
  await loginTab.click();

  await page.getByRole("textbox", { name: /username/iu }).fill(username);
  await page.getByRole("textbox", { name: /^password$/iu }).fill(password);

  await page.getByRole("button", { name: /submit/iu }).click();
};

test("navigates to the dashboard after non-admin user login", async ({
  page,
}) => {
  await logIn(page, e2eUsers.user);

  await expect(page).toHaveURL("/");
});
