import { expect, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { initAuth } from "#auth/auth.ts";

import { getAuthProviders } from "./get-auth-providers.ts";

const it = baseIt.extend("auth", ({ orm }) => initAuth(orm));

it("lists username/password, Plex and the configured generic OAuth providers", ({
  auth,
}) => {
  expect(auth.options.emailAndPassword.enabled).toBe(true);

  vi.stubEnv("OAUTH_PROVIDER_GITHUB_CLIENT_ID", "github-client");
  vi.stubEnv("OAUTH_PROVIDER_GITHUB_CLIENT_SECRET", "github-secret");
  vi.stubEnv("OAUTH_PROVIDER_GITHUB_NAME", "GitHub");
  vi.stubEnv("OAUTH_PROVIDER_GITHUB_ICON", "https://example.com/github.svg");
  vi.stubEnv("OAUTH_PROVIDER_AUTHENTIK_CLIENT_ID", "authentik-client");
  vi.stubEnv("OAUTH_PROVIDER_AUTHENTIK_CLIENT_SECRET", "authentik-secret");
  vi.stubEnv("OAUTH_PROVIDER_AUTHENTIK_DISABLE_SIGNUP", "true");

  expect([...getAuthProviders().values()]).toStrictEqual([
    {
      key: "credential",
      enabled: true,
      disableSignup: auth.options.emailAndPassword.disableSignUp,
    },
    {
      key: "plex",
      enabled: true,
      disableSignup: true,
      name: "Plex",
      icon: "https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg/plex.svg",
    },
    {
      key: "github",
      enabled: true,
      disableSignup: false,
      name: "GitHub",
      icon: "https://example.com/github.svg",
    },
    {
      key: "authentik",
      enabled: true,
      disableSignup: true,
      name: "Authentik",
      icon: "",
    },
  ]);
});
