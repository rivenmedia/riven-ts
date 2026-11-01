import { expect, it } from "vitest";

import { getGenericOAuthProviders } from "./oauth-utils.ts";

it("parses environment into generic OAuth providers", () => {
  const env = {
    // Google OAuth provider configuration
    OAUTH_PROVIDER_GOOGLE_CLIENT_ID: "your-client-id",
    OAUTH_PROVIDER_GOOGLE_CLIENT_SECRET: "your-client-secret",
    OAUTH_PROVIDER_GOOGLE_DISCOVERY_URL:
      "https://accounts.google.com/.well-known/openid-configuration",
    OAUTH_PROVIDER_GOOGLE_SCOPES: "openid,email,profile",
    OAUTH_PROVIDER_GOOGLE_PKCE: "true",
    OAUTH_PROVIDER_GOOGLE_NAME: "Google",
    OAUTH_PROVIDER_GOOGLE_ICON: "https://example.com/google-icon.svg",
    OAUTH_PROVIDER_GOOGLE_TOKEN_URL: "https://example.com/google-token",
    OAUTH_PROVIDER_GOOGLE_USER_INFO_URL: "https://example.com/google-userinfo",

    // Twitch OAuth provider configuration
    OAUTH_PROVIDER_TWITCH_CLIENT_ID: "your-client-id",
    OAUTH_PROVIDER_TWITCH_CLIENT_SECRET: "your-client-secret",
    OAUTH_PROVIDER_TWITCH_DISCOVERY_URL:
      "https://id.twitch.tv/.well-known/openid-configuration",
    OAUTH_PROVIDER_TWITCH_SCOPES: "openid,email,profile",
    OAUTH_PROVIDER_TWITCH_PKCE: "true",
    OAUTH_PROVIDER_TWITCH_NAME: "Twitch",
    OAUTH_PROVIDER_TWITCH_ICON: "https://example.com/twitch-icon.svg",
    OAUTH_PROVIDER_TWITCH_REDIRECT_URI: "https://example.com/twitch-redirect",
    OAUTH_PROVIDER_TWITCH_AUTH_URL: "https://id.twitch.tv/oauth2/authorize",
  } as const satisfies NodeJS.ProcessEnv;

  const providers = getGenericOAuthProviders(env);

  expect(providers).toStrictEqual([
    {
      providerId: "google",
      clientId: "your-client-id",
      clientSecret: "your-client-secret",
      discoveryUrl:
        "https://accounts.google.com/.well-known/openid-configuration",
      scopes: ["openid", "email", "profile"],
      pkce: true,
      disableSignUp: false,
      redirectURI: undefined,
      authorizationUrl: undefined,
      tokenUrl: "https://example.com/google-token",
      userInfoUrl: "https://example.com/google-userinfo",
      name: "Google",
      icon: "https://example.com/google-icon.svg",
    },
    {
      providerId: "twitch",
      clientId: "your-client-id",
      clientSecret: "your-client-secret",
      discoveryUrl: "https://id.twitch.tv/.well-known/openid-configuration",
      scopes: ["openid", "email", "profile"],
      pkce: true,
      disableSignUp: false,
      redirectURI: "https://example.com/twitch-redirect",
      authorizationUrl: "https://id.twitch.tv/oauth2/authorize",
      tokenUrl: undefined,
      userInfoUrl: undefined,
      name: "Twitch",
      icon: "https://example.com/twitch-icon.svg",
    },
  ]);
});
