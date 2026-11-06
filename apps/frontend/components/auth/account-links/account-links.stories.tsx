import { preview } from "#.storybook/preview.tsx";
import { AccountLinks } from "#components/auth/account-links/account-links.tsx";

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
    accounts: [{ providerId: "plex" }],
    providers: { plex: { enabled: true } },
  },
});

export const NoneLinked = meta.story({
  args: {
    accounts: [],
  },
});
