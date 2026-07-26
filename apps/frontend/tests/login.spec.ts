import { GET_AUTH_PROVIDERS } from "@/app/(public)/login/_queries/get-auth-providers.query";
import { GET_INSTANCE_SETUP_REQUIRED } from "@/app/_queries/get-instance-setup-required.query";
import {
  HttpResponse,
  expect,
  graphql,
  http,
  test,
} from "@/playwright/fixtures";
import { serialiseCookie } from "@/playwright/serialise-cookie";

import assert from "node:assert";

import type { UserWithRole } from "better-auth/client/plugins";
import type { TestCookie } from "better-auth/plugins";

test.use({
  mswHandlers: async ({ mswHandlers }, use) =>
    use([
      ...mswHandlers,
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
    ]),
});

test("navigates to the dashboard after non-admin user login", async ({
  authHelpers,
  page,
  msw,
  standardUser,
}) => {
  msw.use(
    http.post("**/api/auth/sign-in/username", async () => {
      const [cookie] = await authHelpers.getCookies({
        userId: standardUser.id,
      });

      assert(cookie);

      const userRoleCookie = {
        name: "user_role",
        path: "/",
        value: standardUser.role,
        domain: "localhost",
      } satisfies TestCookie;

      const setCookies = [cookie, userRoleCookie].map(serialiseCookie);

      return HttpResponse.json<{ user: UserWithRole }>(
        { user: standardUser },
        {
          headers: {
            "set-cookie": setCookies.join(", "),
          },
        },
      );
    }),
  );

  await page.goto("/login");

  await page.getByRole("tab", { name: /login/i }).click();

  await page.getByRole("textbox", { name: /username/i }).fill("username");
  await page.getByRole("textbox", { name: /^password$/i }).fill("password");

  await page.getByRole("button", { name: /submit/i }).click();

  await expect(page).toHaveURL("/");
});

test("does not navigate to the setup page after non-admin user login if setup is required", async ({
  authHelpers,
  page,
  msw,
  standardUser,
  context,
}) => {
  msw.use(
    graphql.query(GET_INSTANCE_SETUP_REQUIRED, () =>
      HttpResponse.json({
        data: {
          instanceStatus: {
            __typename: "InstanceStatus",
            setupRequired: true,
          },
        },
      }),
    ),
    http.post("**/api/auth/sign-in/username", async () => {
      const [cookie] = await authHelpers.getCookies({
        userId: standardUser.id,
      });

      assert(cookie);

      await context.addCookies([
        {
          name: "user_role",
          path: "/",
          value: standardUser.role,
          domain: "localhost",
        },
      ]);

      return HttpResponse.json<{ user: UserWithRole }>(
        { user: standardUser },
        {
          headers: {
            "set-cookie": serialiseCookie(cookie),
          },
        },
      );
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
  page,
  msw,
  adminUser,
  context,
}) => {
  msw.use(
    graphql.query(GET_INSTANCE_SETUP_REQUIRED, () =>
      HttpResponse.json({
        data: {
          instanceStatus: {
            __typename: "InstanceStatus",
            setupRequired: true,
          },
        },
      }),
    ),
    http.post("**/api/auth/sign-in/username", async () => {
      const [cookie] = await authHelpers.getCookies({
        userId: adminUser.id,
      });

      assert(cookie);

      await context.addCookies([
        {
          name: "user_role",
          path: "/",
          value: adminUser.role,
          domain: "localhost",
        },
      ]);

      return HttpResponse.json<{ user: UserWithRole }>(
        { user: adminUser },
        {
          headers: {
            "set-cookie": serialiseCookie(cookie),
          },
        },
      );
    }),
  );

  await page.goto("/login");

  await page.getByRole("tab", { name: /login/i }).click();

  await page.getByRole("textbox", { name: /username/i }).fill("username");
  await page.getByRole("textbox", { name: /^password$/i }).fill("password");

  await page.getByRole("button", { name: /submit/i }).click();

  await expect(page).toHaveURL("/setup");
});
