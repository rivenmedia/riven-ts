import { betterAuth } from "better-auth";
import { getSessionCookie } from "better-auth/cookies";
import { testUtils } from "better-auth/plugins";
import { DateTime } from "luxon";
import {
  HttpResponse,
  test as baseTest,
  http,
} from "next/experimental/testmode/playwright/msw";

import type { Session } from "better-auth";
import type { UserWithRole } from "better-auth/client/plugins";
import type { TestHelpers } from "better-auth/plugins";
import type {
  DefaultBodyType,
  PathParams,
} from "next/experimental/testmode/playwright/msw";
import type { SetReturnType } from "type-fest";

export * from "next/experimental/testmode/playwright/msw";

interface Fixtures {
  session: Session;
  adminUser: UserWithRole & { role: "admin" };
  standardUser: UserWithRole & { role: "user" };
  authHelpers: TestHelpers;
}

export const test = baseTest.extend<Fixtures>({
  session: async ({}, use) => {
    const session: Session = {
      createdAt: DateTime.now().toJSDate(),
      expiresAt: DateTime.now().plus({ days: 7 }).toJSDate(),
      id: "session-id",
      token: "token",
      updatedAt: DateTime.now().toJSDate(),
      userId: "user-id",
    };

    await use(session);
  },
  authHelpers: async ({}, use) => {
    const testUtilsPlugin = testUtils();

    type TestUtilsInitReturn = Awaited<ReturnType<typeof testUtilsPlugin.init>>;

    const fixedTestUtilsPlugin = {
      ...testUtilsPlugin,
      init: testUtilsPlugin.init.bind(null) as SetReturnType<
        typeof testUtilsPlugin.init,
        TestUtilsInitReturn & {
          options: Exclude<TestUtilsInitReturn["options"], undefined>;
        }
      >,
    };

    const instance = betterAuth({
      baseURL: "https://localhost:9000",
      plugins: [fixedTestUtilsPlugin],
      advanced: {
        cookiePrefix: "riven",
      },
    });

    const { test: testHelpers } = await instance.$context;

    await use(testHelpers);
  },
  standardUser: async ({ authHelpers }, use) => {
    const user = {
      ...authHelpers.createUser(),
      banned: false,
      role: "user",
    } as const;

    await use(user);
  },
  adminUser: async ({ standardUser }, use) => {
    await use({
      ...standardUser,
      role: "admin",
    });
  },
});

test.use({
  mswHandlers: async ({ standardUser, session }, use) =>
    use([
      http.get<
        PathParams,
        DefaultBodyType,
        { session: Session; user: UserWithRole } | null
      >("**/api/auth/get-session", ({ request, cookies }) => {
        const sessionCookie = getSessionCookie(request, {
          cookiePrefix: "riven",
        });
        const userRole = cookies["user_role"];

        if (!sessionCookie || !userRole) {
          return HttpResponse.json(null);
        }

        return HttpResponse.json({
          session,
          user: {
            ...standardUser,
            role: userRole,
          },
        });
      }),
    ]),
});
