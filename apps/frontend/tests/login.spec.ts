import { GET_AUTH_PROVIDERS } from "@/app/(public)/auth/login/_queries/get-auth-providers.query";
import {
  HttpResponse,
  expect,
  graphql,
  http,
  test,
} from "@/playwright/fixtures";

import { DateTime } from "luxon";

import type { Session } from "better-auth";
import type { UserWithRole } from "better-auth/client/plugins";

test("navigates to the dashboard after non-admin user login", async ({
  page,
  msw,
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
    http.post("**/api/auth/sign-in/username", () =>
      HttpResponse.json<{ user: UserWithRole }>({
        user: {
          id: "1",
          email: "email@example.com",
          createdAt: new Date(),
          emailVerified: false,
          name: "Test User",
          updatedAt: new Date(),
          banned: false,
          role: "user",
        },
      }),
    ),
    http.post(
      "**/api/auth/get-session",
      () => HttpResponse.json<{ session: Session }>(null, { status: 404 }),
      { once: true },
    ),
    http.post("**/api/auth/get-session", () =>
      HttpResponse.json<{ session: Session }>({
        session: {
          createdAt: DateTime.now().toJSDate(),
          expiresAt: DateTime.now().plus({ days: 7 }).toJSDate(),
          id: "session-id",
          token: "token",
          updatedAt: DateTime.now().toJSDate(),
          userId: "1",
          ipAddress: "localhost",
        },
      }),
    ),
  );

  await page.goto("/auth/login");

  await page.getByRole("tab", { name: /login/i }).click();

  await page.getByRole("textbox", { name: /username/i }).fill("username");
  await page.getByRole("textbox", { name: /^password$/i }).fill("password");

  await page.getByRole("button", { name: /submit/i }).click();

  await expect(page).toHaveURL("/");
});

test("navigates to the setup page after admin user login if setup is required", async ({
  page,
  msw,
}) => {
  const mockUser = {
    id: "1",
    email: "email@example.com",
    createdAt: new Date(),
    emailVerified: false,
    name: "Test User",
    updatedAt: new Date(),
    banned: false,
    role: "admin",
  } as const satisfies UserWithRole;

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
    http.post("**/api/auth/sign-in/username", () =>
      HttpResponse.json<{ user: UserWithRole }>({
        user: mockUser,
      }),
    ),
    http.get(
      "**/api/auth/get-session",
      () =>
        HttpResponse.json(null, {
          status: 404,
        }),
      { once: true },
    ),
    http.get("**/api/auth/get-session", () =>
      HttpResponse.json<{ session: Session; user: UserWithRole }>({
        user: mockUser,
        session: {
          createdAt: DateTime.now().toJSDate(),
          expiresAt: DateTime.now().plus({ days: 7 }).toJSDate(),
          id: "session-id",
          token: "token",
          updatedAt: DateTime.now().toJSDate(),
          userId: "1",
          ipAddress: "localhost",
        },
      }),
    ),
  );

  await page.goto("/auth/login");

  await page.getByRole("tab", { name: /login/i }).click();

  await page.getByRole("textbox", { name: /username/i }).fill("username");
  await page.getByRole("textbox", { name: /^password$/i }).fill("password");

  await page.getByRole("button", { name: /submit/i }).click();

  await expect(page).toHaveURL("/setup");
});
