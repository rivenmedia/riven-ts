import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import {
  admin as adminPlugin,
  genericOAuth,
  lastLoginMethod,
  openAPI,
  username,
} from "better-auth/plugins";

import { privateEnvironment } from "../environment/private-environment.schema";
import { getGenericOAuthProviders } from "./auth/oauth-utils";
import { ac, admin, manager, user } from "./auth/permissions";
import { plexOAuth } from "./auth/plex-oauth";
import { orm } from "./database";

export const auth = betterAuth({
  secret: privateEnvironment.AUTH_SECRET,
  baseURL: privateEnvironment.ORIGIN,
  database: drizzleAdapter(orm, {
    provider: "sqlite",
  }),
  user: {
    changeEmail: {
      enabled: true,
    },
    deleteUser: {
      enabled: true,
    },
  },
  plugins: [
    username(),
    adminPlugin({
      ac,
      roles: {
        admin,
        user,
        manager,
      },
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    openAPI(),
    passkey({
      rpID: privateEnvironment.PASSKEY_RP_ID,
      rpName: privateEnvironment.PASSKEY_RP_NAME,
      origin: privateEnvironment.ORIGIN,
    }),
    lastLoginMethod({ storeInDatabase: true }),
    genericOAuth({
      config: [
        ...(!privateEnvironment.DISABLE_PLEX
          ? [
              plexOAuth({
                clientId: privateEnvironment.PLEX_CLIENT_ID,
                product: "Riven Media",
                version: "1.0",
                platform: "Web",
                device: "Browser",
                disableSignUp: !privateEnvironment.ENABLE_PLEX_SIGNUP,
                baseURL: privateEnvironment.ORIGIN,
              }),
            ]
          : []),
        ...getGenericOAuthProviders(process.env),
      ],
    }),
  ],
  socialProviders: {},
  trustedOrigins: [
    "http://localhost:9000",
    "http://192.168.1.*:9000",
    privateEnvironment.ORIGIN,
  ].filter((origin) => origin != null),
  advanced: {
    cookiePrefix: "riven",
  },
  telemetry: {
    enabled: false,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 1 * 60, // Cache duration in seconds
    },
  },
});

export interface AuthProvider {
  enabled: boolean;
  disableSignup: boolean;
  name?: string;
  icon?: string | undefined;
}

export function getAuthProviders() {
  const providers: Record<string, AuthProvider> = {};

  if (auth.options.emailAndPassword) {
    providers["credential"] = {
      enabled: auth.options.emailAndPassword.enabled,
      disableSignup: auth.options.emailAndPassword.disableSignUp,
    };
  }

  if (!privateEnvironment.DISABLE_PLEX) {
    providers["plex"] = {
      enabled: true,
      disableSignup: !privateEnvironment.ENABLE_PLEX_SIGNUP,
      name: "Plex",
      icon: "https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg/plex.svg",
    };
  }

  const genericProviders = getGenericOAuthProviders(process.env);

  for (const provider of genericProviders) {
    providers[provider.providerId] = {
      enabled: true,
      disableSignup: !!provider.disableSignUp,
      name: provider.name || provider.providerId,
      icon: provider.icon,
    };
  }

  return providers;
}
