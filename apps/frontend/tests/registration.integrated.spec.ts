import { expect, test } from "#playwright/integrated-fixtures.ts";
import { waitForHydration } from "#playwright/wait-for-hydration.ts";

test("navigates to the dashboard after registration", async ({
  page,
}, testInfo) => {
  // Unique to the test and attempt, and short enough for Better Auth's 30-character limit on usernames
  const username = `e2e_${testInfo.testId.split("-").at(-1) ?? ""}_${String(testInfo.retry)}`;

  await page.goto("/login");

  const registerTab = page.getByRole("tab", { name: /register/iu });

  await waitForHydration(registerTab);
  await registerTab.click();

  await page.getByRole("textbox", { name: /username/iu }).fill(username);
  await page
    .getByRole("textbox", { name: /email/iu })
    .fill(`${username}@riven.invalid`);
  await page.getByRole("textbox", { name: /^password$/iu }).fill("password");
  await page
    .getByRole("textbox", { name: /confirm password/iu })
    .fill("password");

  await page.getByRole("button", { name: /submit/iu }).click();

  await expect(page.getByText(/registration successful/iu)).toBeVisible();

  await expect(page).toHaveURL("/");
});
