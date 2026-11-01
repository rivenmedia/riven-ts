import { frontendSettings } from "#utilities/frontend-settings.ts";

import { auth } from "./auth.ts";
import { getGenericOAuthProviders } from "./oauth-utils.ts";

export interface AuthProvider {
  key: string;
  enabled: boolean;
  disableSignup: boolean;
  name?: string;
  icon?: string | undefined;
}

export function getAuthProviders() {
  const providers = new Map<string, AuthProvider>();

  if (auth.options.emailAndPassword.enabled) {
    providers.set("credential", {
      key: "credential",
      enabled: auth.options.emailAndPassword.enabled,
      disableSignup: auth.options.emailAndPassword.disableSignUp,
    });
  }

  if (!frontendSettings.disablePlex) {
    providers.set("plex", {
      key: "plex",
      enabled: true,
      disableSignup: !frontendSettings.enablePlexSignup,
      name: "Plex",
      icon: "https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg/plex.svg",
    });
  }

  const genericProviders = getGenericOAuthProviders(process.env);

  for (const provider of genericProviders) {
    providers.set(provider.providerId, {
      key: provider.providerId,
      enabled: true,
      disableSignup: Boolean(provider.disableSignUp),
      name: provider.name ?? provider.providerId,
      icon: provider.icon,
    });
  }

  return providers;
}
