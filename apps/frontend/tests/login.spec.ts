import { GET_AUTH_PROVIDERS } from "@/app/(public)/login/_queries/get-auth-providers.query";
import {
  HttpResponse,
  expect,
  graphql,
  http,
  test,
} from "@/playwright/fixtures";

import type { UserWithRole } from "better-auth/client/plugins";

test("navigates to the dashboard after non-admin user login", async ({
  authHelpers,
  context,
  page,
  msw,
  userWithRole,
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
    http.post("**/api/auth/sign-in/username", async () => {
      const cookies = await authHelpers.getCookies({
        userId: userWithRole.id,
      });

      await context.addCookies(cookies);

      return HttpResponse.json<{ user: UserWithRole }>({
        user: userWithRole,
      });
    }),
  );

  await page.goto("/login");

  await page.getByRole("tab", { name: /login/i }).click();

  await page.getByRole("textbox", { name: /username/i }).fill("username");
  await page.getByRole("textbox", { name: /^password$/i }).fill("password");

  await page.getByRole("button", { name: /submit/i }).click();

  await expect(page).toHaveURL("/");
});

test("navigates to the setup page after admin user login if setup is required", async ({
  authHelpers,
  context,
  page,
  msw,
  userWithRole,
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
    http.post("**/api/auth/sign-in/username", async () => {
      const cookies = await authHelpers.getCookies({
        userId: userWithRole.id,
      });

      await context.addCookies(cookies);

      return HttpResponse.json<{ user: UserWithRole }>({
        user: userWithRole,
      });
    }),
  );

  await page.goto("/login");

  await page.getByRole("tab", { name: /login/i }).click();

  await page.getByRole("textbox", { name: /username/i }).fill("username");
  await page.getByRole("textbox", { name: /^password$/i }).fill("password");

  await page.getByRole("button", { name: /submit/i }).click();

  await expect(page).toHaveURL("/setup");
});
