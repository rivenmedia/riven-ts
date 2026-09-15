import { preview } from "@/.storybook/preview";

import { fn } from "storybook/test";

import { OauthProviderButton } from "./oauth-provider-button";

const meta = preview.meta({
  title: "Auth / OauthProviderButton",
  component: OauthProviderButton,
  args: {
    isLastUsed: false,
    onClick: fn(),
  },
});

export const Plex = meta.story({
  name: "Plex",
  args: {
    providerKey: "plex",
    provider: { name: "Plex" },
  },
});

export const GenericOAuth = meta.story({
  name: "GenericOAuth",
  args: {
    providerKey: "authentik",
    provider: { name: "Authentik" },
  },
});

export const LastUsed = meta.story({
  name: "LastUsed",
  args: {
    providerKey: "plex",
    provider: { name: "Plex" },
    isLastUsed: true,
  },
});

export const WithIcon = meta.story({
  name: "WithIcon",
  args: {
    providerKey: "google",
    provider: {
      name: "Google",
      icon: "https://cdn.jsdelivr.net/gh/selfhst/icons/svg/google.svg",
    },
  },
});
