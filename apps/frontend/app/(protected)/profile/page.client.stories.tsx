import { preview } from "@/.storybook/preview";

import { DateTime } from "luxon";

import { ProfilePage } from "./page.client";

const meta = preview.meta({
  title: "Pages / Profile",
  component: ProfilePage,
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
