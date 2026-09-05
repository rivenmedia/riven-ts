import { preview } from "@/.storybook/preview";

import { DateTime } from "luxon";

import { AccountLinks } from "./account-links";

const meta = preview.meta({
  title: "Auth / AccountLinks",
  component: AccountLinks,
  args: {
    providers: {
      credential: {
        enabled: true,
        disableSignup: false,
      },
      plex: {
        enabled: true,
        disableSignup: false,
        name: "Plex",
      },
      authentik: {
        enabled: true,
        disableSignup: false,
        name: "Authentik",
      },
    },
  },
});

export const OneLinked = meta.story({
  args: {
    accounts: [
      {
        id: "1",
        providerId: "plex",
        createdAt: DateTime.fromISO("2024-01-01").toJSDate(),
        updatedAt: DateTime.fromISO("2024-01-01").toJSDate(),
        accountId: "plex-123",
        scopes: [],
      },
    ],
  },
});

export const NoneLinked = meta.story({
  args: {
    accounts: [],
  },
});
