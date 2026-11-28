import { ac, admin, manager, user } from "@repo/util-auth/access-control";

import { passkeyClient } from "@better-auth/passkey/client";
import {
  adminClient,
  lastLoginMethodClient,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { privateEnvironment } from "#environment/private-environment.schema.ts";

import { nextCookiesClientPlugin } from "./plugins/next-cookies.ts";

export const authClient = createAuthClient({
  // The browser uses the origin it was served from, which forwards auth requests to Riven.
  // The server calls Riven directly, as its public URL may not be reachable from inside its own container.
  baseURL:
    "window" in globalThis
      ? globalThis.location.origin
      : privateEnvironment.BACKEND_URL,
  plugins: [
    usernameClient(),
    adminClient({
      ac,
      roles: {
        admin,
        manager,
        user,
      },
    }),
    lastLoginMethodClient(),
    passkeyClient(),
    nextCookiesClientPlugin,
  ],
});

export type User = typeof authClient.$Infer.Session.user;

export type Session = typeof authClient.$Infer.Session;
