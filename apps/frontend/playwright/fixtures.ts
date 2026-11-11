import { faker } from "@faker-js/faker";
import { PlaywrightNetworkSource } from "@msw/playwright";
import { betterAuth } from "better-auth";
import { testUtils } from "better-auth/plugins";
import { OperationTypeNode, getOperationAST } from "graphql";
import { DateTime } from "luxon";
import { HttpResponse } from "msw";
import { defineNetwork } from "msw/experimental";
import { test as nextTest } from "next/experimental/testmode/playwright.js";

import { api } from "#mocks/graphql.ts";
import { createAuthProvidersHandler } from "#mocks/handlers/auth-providers.handler.ts";
import {
  createRecentlyAddedHandler,
  createTmdbNowPlayingHandler,
  createTmdbTrendingMoviesHandler,
  createTmdbTrendingShowsHandler,
} from "#mocks/handlers/home.handler.ts";
import {
  createInstanceRestartStatusHandler,
  createInstanceSetupRequiredHandler,
} from "#mocks/handlers/instance-status.handler.ts";

import {
  AUTH_COOKIE_PREFIX,
  USER_ROLE_COOKIE,
  createGetSessionHandler,
  hasPermissionHandler,
  passkeysUnavailableHandler,
} from "./auth-handlers.ts";
import { NextFetchSource, isNextFetchFrame } from "./next-fetch-source.ts";
import { remoteAssetHandlers } from "./remote-asset-handlers.ts";
import { serialiseCookie } from "./serialise-cookie.ts";

import type { TypedDocumentNode } from "@apollo/client";
import type { UserRole } from "@repo/util-auth/access-control";
import type { Session } from "better-auth";
import type { UserWithRole } from "better-auth/client/plugins";
import type { TestCookie, TestHelpers } from "better-auth/plugins";
import type { AnyHandler, HttpResponseResolver } from "msw";
import type { NetworkApi } from "msw/experimental";
import type { SetReturnType } from "type-fest";

export { expect } from "@playwright/test";
export { HttpResponse, http } from "msw";

/**
 * Wraps handlers for `test.use({ handlers })`.
 *
 * Playwright reads an array as a `[value, options]` fixture tuple, so passing the handlers directly would drop all but the first.
 */
export const withHandlers = (
  ...handlers: AnyHandler[]
): [AnyHandler[], { scope: "test" }] => [handlers, { scope: "test" }];

interface Options {
  /**
   * The role of the user who is signed in when the test starts, or `null` when signed out.
   *
   * @default null
   */
  signedInAs: UserRole | null;

  /**
   * Handlers that take precedence over the baseline handlers for every test using them.
   * Use `network.use()` to add handlers inside a single test.
   *
   * @default []
   */
  handlers: AnyHandler[];
}

interface Fixtures {
  authHelpers: TestHelpers;
  user: UserWithRole;
  session: Session;

  /** Handlers describing a healthy instance that has already been set up, with some media to show */
  baselineHandlers: AnyHandler[];

  /**
   * The mocked network, shared by the browser (HTTP and WebSocket) and the Next.js server.
   *
   * @see https://mswjs.io/docs/api/setup-server/use
   */
  network: NetworkApi<[PlaywrightNetworkSource, NextFetchSource]>;

  auth: {
    /** Creates the cookies for a session signed in with the given role */
    getCookies: (role: UserRole) => Promise<TestCookie[]>;

    /** A resolver for a sign-in or sign-up endpoint that signs the user in with the given role */
    signIn: (role: UserRole) => HttpResponseResolver;

    /** A resolver for the sign-out endpoint that expires the session cookies */
    signOut: () => HttpResponseResolver;
  };

  /**
   * Records the variables of every request for the given GraphQL operation,
   * without changing how it's handled.
   */
  recordOperation: <TVariables extends Record<string, unknown>>(
    document: TypedDocumentNode<unknown, TVariables>,
  ) => TVariables[];

  _seedFaker: undefined;
  _signIn: undefined;
}

export const test = nextTest.extend<Options & Fixtures>({
  signedInAs: [null, { option: true }],
  handlers: [[], { option: true }],

  _seedFaker: [
    async ({}, use) => {
      faker.seed(1);

      await use(undefined);
    },
    { auto: true },
  ],

  authHelpers: async ({ baseURL }, use) => {
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
      baseURL,
      plugins: [fixedTestUtilsPlugin],
      advanced: { cookiePrefix: AUTH_COOKIE_PREFIX },
    });

    const { test: testHelpers } = await instance.$context;

    await use(testHelpers);
  },

  user: async ({ authHelpers }, use) => {
    await use({ ...authHelpers.createUser(), banned: false, role: "user" });
  },

  session: async ({ user }, use) => {
    const now = DateTime.now();

    await use({
      createdAt: now.toJSDate(),
      expiresAt: now.plus({ days: 7 }).toJSDate(),
      id: "session-id",
      token: "token",
      updatedAt: now.toJSDate(),
      userId: user.id,
    });
  },

  baselineHandlers: async ({ session, user }, use) => {
    await use([
      createGetSessionHandler(session, user),
      hasPermissionHandler,
      passkeysUnavailableHandler,
      createInstanceSetupRequiredHandler(false),
      createInstanceRestartStatusHandler(false),
      createAuthProvidersHandler(),
      createTmdbNowPlayingHandler(),
      createTmdbTrendingMoviesHandler(),
      createTmdbTrendingShowsHandler(),
      createRecentlyAddedHandler(),
      ...remoteAssetHandlers,
    ]);
  },

  network: [
    // `next` registers its own routes, so it must be set up first for the network's routes to take precedence
    async ({ next, context, handlers, baselineHandlers }, use) => {
      const network = defineNetwork({
        sources: [
          new PlaywrightNetworkSource({ context, skipAssetRequests: true }),
          new NextFetchSource(next),
        ],
        handlers: [...handlers, ...baselineHandlers],
        context: { quiet: true },
        onUnhandledFrame: ({ frame, defaults }) => {
          // The page's own requests (navigations, RSC payloads, etc.) are expected to reach the Next.js server
          if (isNextFetchFrame(frame)) {
            defaults.warn();
          }
        },
      });

      await network.enable();
      await use(network);
      await network.disable();
    },
    { auto: true },
  ],

  auth: async ({ authHelpers, baseURL, session, user }, use) => {
    const { hostname } = new URL(baseURL ?? "");

    const getCookies = async (role: UserRole): Promise<TestCookie[]> => [
      ...(await authHelpers.getCookies({ userId: user.id, domain: hostname })),
      { name: USER_ROLE_COOKIE, value: role, domain: hostname, path: "/" },
    ];

    await use({
      getCookies,
      // The backend sets the session cookies on the Next.js server's response, rather than in the browser
      signIn: (role) => async () => {
        const headers = new Headers();

        for (const cookie of await getCookies(role)) {
          headers.append("set-cookie", serialiseCookie(cookie));
        }

        return HttpResponse.json(
          { redirect: false, token: session.token, user: { ...user, role } },
          { headers },
        );
      },
      signOut: () => async () => {
        const headers = new Headers();

        for (const { name, path } of await getCookies("user")) {
          headers.append("set-cookie", `${name}=; Path=${path}; Max-Age=0`);
        }

        return HttpResponse.json({ success: true }, { headers });
      },
    });
  },

  _signIn: [
    async ({ auth, context, signedInAs }, use) => {
      if (signedInAs) {
        const cookies = await auth.getCookies(signedInAs);

        await context.addCookies(
          cookies.map(({ expires, ...cookie }) => cookie),
        );
      }

      await use(undefined);
    },
    { auto: true },
  ],

  recordOperation: async ({ network }, use) => {
    await use(
      <TVariables extends Record<string, unknown>>(
        document: TypedDocumentNode<unknown, TVariables>,
      ) => {
        const recorded: TVariables[] = [];
        const createHandler =
          getOperationAST(document)?.operation === OperationTypeNode.MUTATION
            ? api.mutation
            : api.query;

        // Returning nothing falls through to the handler that actually answers the request
        network.use(
          createHandler(document, ({ variables }) => {
            recorded.push(variables);
          }),
        );

        return recorded;
      },
    );
  },
});
