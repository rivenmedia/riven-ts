import { expect, http, test } from "#playwright/fixtures.ts";
import { waitForHydration } from "#playwright/wait-for-hydration.ts";

test("navigates to the dashboard after registration", async ({
  auth,
  network,
  page,
}) => {
  network.use(http.post("**/api/auth/sign-up/email", auth.signIn("user")));

  await page.goto("/login");

  const registerTab = page.getByRole("tab", { name: /register/iu });

  await waitForHydration(registerTab);
  await registerTab.click();

  await page.getByRole("textbox", { name: /username/iu }).fill("username");
  await page
    .getByRole("textbox", { name: /email/iu })
    .fill("email@example.com");
  await page.getByRole("textbox", { name: /^password$/iu }).fill("password");
  await page
    .getByRole("textbox", { name: /confirm password/iu })
    .fill("password");

  await page.getByRole("button", { name: /submit/iu }).click();

  await expect(page.getByText(/registration successful/iu)).toBeVisible();

  await expect(page).toHaveURL("/");
});
