import { createInstanceSetupRequiredHandler } from "#mocks/handlers/instance-status.handler.ts";
import { expect, http, test } from "#playwright/fixtures.ts";
import { waitForHydration } from "#playwright/wait-for-hydration.ts";

import type { Page } from "@playwright/test";

const logIn = async (page: Page) => {
  await page.goto("/login");

  const loginTab = page.getByRole("tab", { name: /login/iu });

  await waitForHydration(loginTab);
  await loginTab.click();

  await page.getByRole("textbox", { name: /username/iu }).fill("username");
  await page.getByRole("textbox", { name: /^password$/iu }).fill("password");

  await page.getByRole("button", { name: /submit/iu }).click();
};

test("navigates to the dashboard after non-admin user login", async ({
  auth,
  network,
  page,
}) => {
  network.use(http.post("**/api/auth/sign-in/username", auth.signIn("user")));

  await logIn(page);

  await expect(page).toHaveURL("/");
});

test("does not navigate to the setup page after non-admin user login if setup is required", async ({
  auth,
  network,
  page,
}) => {
  network.use(
    createInstanceSetupRequiredHandler(true),
    http.post("**/api/auth/sign-in/username", auth.signIn("user")),
  );

  await logIn(page);

  await expect(page).toHaveURL("/");
});

test("navigates to the setup page after admin user login if setup is required", async ({
  auth,
  network,
  page,
}) => {
  network.use(
    createInstanceSetupRequiredHandler(true),
    http.post("**/api/auth/sign-in/username", auth.signIn("admin")),
  );

  test.fail(
    true,
    "Known bug: the setup page renders, but the URL stays on `/`, as Next.js follows the proxy's redirect within the login action's redirect",
  );

  await logIn(page);

  await expect(page.getByText("Initial Setup")).toBeVisible();
  await expect(page).toHaveURL(/\/setup\//u);
});

test("stays on the login page when passkey autofill isn't available", async ({
  page,
}) => {
  const passkeyOptions = page.waitForResponse(
    "**/api/auth/passkey/generate-authenticate-options",
  );

  await page.goto("/login");
  await passkeyOptions;

  await expect(page.getByRole("tab", { name: "Login" })).toBeVisible();
  await expect(page).toHaveURL("/login");
});
