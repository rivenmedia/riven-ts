import { GET_AUTH_PROVIDERS } from "@/app/(public)/login/_queries/get-auth-providers.query";
import {
  HttpResponse,
  expect,
  graphql,
  http,
  test,
} from "@/playwright/fixtures";

import type { UserWithRole } from "better-auth/client/plugins";

test("navigates to the dashboard after registration", async ({
  page,
  msw,
  userWithRole,
  authHelpers,
  context,
}) => {
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
    http.post("**/api/auth/sign-up/email", async () => {
      const cookies = await authHelpers.getCookies({
        userId: userWithRole.id,
      });

      await context.addCookies(cookies);

      return HttpResponse.json<{ user: UserWithRole }>({ user: userWithRole });
    }),
  );

  await page.goto("/login");

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
