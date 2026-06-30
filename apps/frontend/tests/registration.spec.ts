import { GET_AUTH_PROVIDERS } from "@/app/(public)/auth/login/_queries/get-auth-providers.query";
import {
  HttpResponse,
  expect,
  graphql,
  http,
  test,
} from "@/playwright/fixtures";

test("navigates to the dashboard after registration", async ({ page, msw }) => {
  msw.use(
    graphql.query(GET_AUTH_PROVIDERS, () =>
      HttpResponse.json({
        data: {
          authProviders: [
            {
              __typename: "AuthProvider",
              disableSignup: false,
              enabled: true,
              key: "credential",
              name: "Email and Password",
            },
          ],
        },
      }),
    ),
    http.post("**/api/auth/sign-up/email", () =>
      HttpResponse.json({
        user: {
          id: "1",
          email: "email@example.com",
        },
      }),
    ),
  );

  await page.goto("/auth/login");

  await page.getByRole("tab", { name: /register/i }).click();

  await page.getByRole("textbox", { name: /username/i }).fill("username");
  await page.getByRole("textbox", { name: /email/i }).fill("email@example.com");
  await page.getByRole("textbox", { name: /^password$/i }).fill("password");
  await page
    .getByRole("textbox", { name: /confirm password/i })
    .fill("password");

  await page.getByRole("button", { name: /submit/i }).click();

  await expect(page.getByText(/registration successful/i)).toBeVisible();

  await expect(page).toHaveURL("/");
});
