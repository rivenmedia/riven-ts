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

it("derives the discovery URL from the issuer and defaults the display details", () => {
  const providers = getGenericOAuthProviders({
    OAUTH_PROVIDER_KEYCLOAK_CLIENT_ID: "keycloak-client",
    OAUTH_PROVIDER_KEYCLOAK_CLIENT_SECRET: "keycloak-secret",
    OAUTH_PROVIDER_KEYCLOAK_ISSUER: "https://auth.example.com/realms/riven",
    OAUTH_PROVIDER_KEYCLOAK_USERINFO_URL: "https://auth.example.com/userinfo",
    OAUTH_PROVIDER_KEYCLOAK_DISABLE_SIGNUP: "true",
  });

  expect(providers).toStrictEqual([
    {
      providerId: "keycloak",
      clientId: "keycloak-client",
      clientSecret: "keycloak-secret",
      discoveryUrl:
        "https://auth.example.com/realms/riven/.well-known/openid-configuration",
      scopes: undefined,
      pkce: false,
      disableSignUp: true,
      redirectURI: undefined,
      authorizationUrl: undefined,
      tokenUrl: undefined,
      userInfoUrl: "https://auth.example.com/userinfo",
      name: "Keycloak",
      icon: "",
    },
  ]);
});

it("skips providers without both a client ID and secret", () => {
  expect(
    getGenericOAuthProviders({
      OAUTH_PROVIDER_GITHUB_CLIENT_ID: "github-client",
      OAUTH_PROVIDER_GITLAB_CLIENT_SECRET: "gitlab-secret",
      OAUTH_PROVIDER_GITEA_NAME: "Gitea",
    }),
  ).toStrictEqual([]);
});

it("ignores unrelated and unset environment variables", () => {
  expect(
    getGenericOAuthProviders({
      PATH: "/usr/bin",
      OAUTH_PROVIDER_GITHUB_CLIENT_ID: undefined,
      OAUTH_PROVIDER_GITHUB_CLIENT_SECRET: "github-secret",
    }),
  ).toStrictEqual([]);
});

it("treats repeated underscores as a single separator", () => {
  expect(
    getGenericOAuthProviders({
      OAUTH_PROVIDER__GITHUB_CLIENT_ID: "github-client",
      OAUTH_PROVIDER_GITHUB__CLIENT_SECRET: "github-secret",
    }),
  ).toStrictEqual([
    expect.objectContaining({
      providerId: "github",
      clientId: "github-client",
      clientSecret: "github-secret",
    }),
  ]);
});

it("rejects invalid OAuth configuration", () => {
  expect(() =>
    getGenericOAuthProviders({
      OAUTH_PROVIDER_KEYCLOAK_CLIENT_ID: "keycloak-client",
      OAUTH_PROVIDER_KEYCLOAK_CLIENT_SECRET: "keycloak-secret",
      OAUTH_PROVIDER_KEYCLOAK_ISSUER: "not a url",
    }),
  ).toThrow("Invalid OAuth configuration");
});
