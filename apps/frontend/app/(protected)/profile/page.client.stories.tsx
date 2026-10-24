import { DateTime } from "luxon";
import { http, HttpResponse } from "msw";

import { preview } from "#.storybook/preview.tsx";
import { ProfilePage } from "#app/(protected)/profile/page.client.tsx";

import ProfileLayout from "./layout";

import type { Passkey } from "@better-auth/passkey";

const meta = preview.meta({
  title: "Pages / Profile",
  component: ProfilePage,
  decorators: [
    (Story) => (
      <ProfileLayout params={Promise.resolve({})}>
        <Story />
      </ProfileLayout>
    ),
  ],
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
    accounts: [],
    providers: {},
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
    users: [
      {
        id: "1",
        name: "Alice Admin",
        email: "alice@example.com",
        username: "alice",
        role: "admin",
        banned: false,
        createdAt: DateTime.now().minus({ months: 2, weeks: 1 }).toJSDate(),
        updatedAt: DateTime.now().minus({ months: 1 }).toJSDate(),
        emailVerified: true,
        image: null,
        displayUsername: "username",
        banReason: null,
        banExpires: null,
      },
      {
        id: "2",
        name: "Bob Viewer",
        email: "bob@example.com",
        username: "bob",
        role: "user",
        banned: false,
        createdAt: DateTime.now().minus({ months: 1, weeks: 2 }).toJSDate(),
        updatedAt: DateTime.now().minus({ months: 1 }).toJSDate(),
        emailVerified: true,
        image: null,
        displayUsername: "username",
        banReason: null,
        banExpires: null,
      },
      {
        id: "3",
        name: "Charlie Manager",
        email: "charlie@example.com",
        username: "charlie",
        role: "manager",
        banned: false,
        createdAt: DateTime.now().minus({ weeks: 1 }).toJSDate(),
        updatedAt: DateTime.now().minus({ weeks: 1 }).toJSDate(),
        emailVerified: true,
        image: null,
        displayUsername: "username",
      },
    ],
  },
});

export const Member = meta.story({
  args: {
    canManageUsers: false,
    hasCredentialProvider: false,
    accounts: [],
    providers: {},
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
    users: [],
  },
});
