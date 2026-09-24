import { preview } from "@/.storybook/preview";

import { DateTime } from "luxon";
import { http, HttpResponse } from "msw";

import { ProfilePage } from "./page.client";

import type { Passkey } from "@better-auth/passkey";

const meta = preview.meta({
  title: "Pages / Profile",
  component: ProfilePage,
  beforeEach({ msw }) {
    msw.use(
      http.get("**/api/auth/passkey/list-user-passkeys", () =>
        HttpResponse.json<Passkey[]>([
          {
            name: "My First Passkey",
            id: "passkey-1",
            createdAt: DateTime.now().minus({ weeks: 1 }).toJSDate(),
            backedUp: true,
            counter: 1,
            credentialID: "credential-id-1",
            deviceType: "singleDevice",
            publicKey: "public-key-1",
            userId: "user-id-1",
          },
          {
            name: "My Second Passkey",
            id: "passkey-2",
            createdAt: DateTime.now().minus({ days: 3 }).toJSDate(),
            backedUp: true,
            counter: 1,
            credentialID: "credential-id-2",
            deviceType: "singleDevice",
            publicKey: "public-key-2",
            userId: "user-id-1",
          },
        ]),
      ),
    );
  },
});

export const Admin = meta.story({
  args: {
    canManageUsers: true,
    hasCredentialProvider: true,
    user: {
      id: "1",
      email: "admin@example.com",
      username: "admin",
      name: "Admin User",
      role: "admin",
      createdAt: DateTime.now().toJSDate(),
      updatedAt: DateTime.now().toJSDate(),
      lastLoginMethod: "password",
      lastLoginAt: DateTime.now().toJSDate(),
      banned: false,
      emailVerified: true,
    },
  },
});

export const Member = meta.story({
  args: {
    canManageUsers: false,
    hasCredentialProvider: false,
    user: {
      id: "1",
      email: "member@example.com",
      username: "member",
      name: "Member User",
      role: "user",
      createdAt: DateTime.now().toJSDate(),
      updatedAt: DateTime.now().toJSDate(),
      lastLoginMethod: "password",
      lastLoginAt: DateTime.now().toJSDate(),
      banned: false,
      emailVerified: true,
    },
  },
});
