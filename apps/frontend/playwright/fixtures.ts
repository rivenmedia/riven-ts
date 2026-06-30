import { type Session, type User, betterAuth } from "better-auth";
import { type TestHelpers, testUtils } from "better-auth/plugins";
import { DateTime } from "luxon";
import {
  type DefaultBodyType,
  HttpResponse,
  type PathParams,
  test as baseTest,
  http,
} from "next/experimental/testmode/playwright/msw";

import type { UserWithRole } from "better-auth/client/plugins";
import type { SetReturnType } from "type-fest";

export * from "next/experimental/testmode/playwright/msw";

interface Fixtures {
  session: Session;
  userWithRole: UserWithRole;
  authHelpers: TestHelpers;
}

export const test = baseTest.extend<Fixtures>({
  userWithRole: async ({}, use) => {
    const user: UserWithRole = {
      id: "1",
      email: "email@example.com",
      createdAt: DateTime.now().toJSDate(),
      emailVerified: false,
      name: "Test User",
      updatedAt: DateTime.now().toJSDate(),
      banned: false,
      role: "admin",
    };

    await use(user);
  },
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

    const { test } = await instance.$context;

    await use(test);
  },
});

test.use({
  mswHandlers: ({ userWithRole, session }, use) =>
    use([
      http.get<
        PathParams,
        DefaultBodyType,
        { session: Session; user: User } | null
      >("**/api/auth/get-session", ({ cookies }) => {
        const sessionCookie =
          cookies["__Secure-riven.session_token"] ??
          cookies["riven.session_token"];

        if (!sessionCookie) {
          return HttpResponse.json(null);
        }

        return HttpResponse.json({
          session,
          user: userWithRole,
        });
      }),
    ]),
});
