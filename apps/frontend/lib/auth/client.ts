import { ac, admin, manager, user } from "@repo/util-auth/access-control";

import { passkeyClient } from "@better-auth/passkey/client";
import {
  adminClient,
  lastLoginMethodClient,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { nextCookiesClientPlugin } from "./plugins/next-cookies";

export const authClient = createAuthClient({
  baseURL: "https://localhost:9000",
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
  fetchOptions: {
    throw: true,
  },
});

export type User = typeof authClient.$Infer.Session.user;

export type Session = typeof authClient.$Infer.Session;
