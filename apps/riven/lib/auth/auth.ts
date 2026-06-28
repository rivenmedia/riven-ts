// Provides types needed to squash portability errors from @better-auth/passkey
import "@simplewebauthn/server";

import { passkey } from "@better-auth/passkey";
import {
  type Auth,
  type BetterAuthOptions,
  type LogLevel,
  betterAuth,
} from "better-auth";
import { mikroOrmAdapter } from "better-auth-mikro-orm";
import {
  admin as adminPlugin,
  genericOAuth,
  lastLoginMethod,
  openAPI,
  username,
} from "better-auth/plugins";

import { frontendSettings } from "../utilities/frontend-settings.ts";
import { withLogContext } from "../utilities/logger/log-context.ts";
import { logger } from "../utilities/logger/logger.ts";
import { settings } from "../utilities/settings.ts";
import { getGenericOAuthProviders } from "./oauth-utils.ts";
import { ac, admin, manager, user } from "./permissions.ts";
import { plexOAuth } from "./plex-oauth.ts";

import type { MikroORM } from "@mikro-orm/core";
import type { AdapterFactory } from "better-auth/adapters";

const transformLogLevel = (): Exclude<LogLevel, "success"> => {
  switch (settings.logLevel) {
    case "silly":
    case "verbose":
      return "debug";
    case "http":
      return "info";
    default:
      return settings.logLevel;
  }
};

export const authConfig = {
  secret: frontendSettings.authSecret,
  baseURL: frontendSettings.origin,
  logger: {
    disabled: !settings.loggingEnabled,
    level: transformLogLevel(),
    log(level, message, ...args: unknown[]) {
      withLogContext({ "riven.log.source": "auth" }, () => {
        logger[level](message, ...args);
      });
    },
  },
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
      rpID: frontendSettings.passkeyRpId,
      rpName: frontendSettings.passkeyRpName,
      origin: frontendSettings.origin,
    }),
    lastLoginMethod({ storeInDatabase: true }),
    genericOAuth({
      config: [
        ...(!frontendSettings.disablePlex && frontendSettings.plexClientId
          ? [
              plexOAuth({
                clientId: frontendSettings.plexClientId,
                product: "Riven Media",
                version: "1.0",
                platform: "Web",
                device: "Browser",
                disableSignUp: !frontendSettings.enablePlexSignup,
                baseURL: frontendSettings.origin,
              }),
            ]
          : []),
        ...getGenericOAuthProviders(process.env),
      ],
    }),
  ],
  account: {
    accountLinking: {
      enabled: true,
      allowDifferentEmails: true,
      trustedProviders: [
        ...(frontendSettings.disablePlex ? [] : ["plex"]),
        ...getGenericOAuthProviders(process.env).map((p) => p.providerId),
      ],
    },
    encryptOAuthTokens: true,
  },
  emailAndPassword: {
    enabled: !frontendSettings.disableEmailPassword,
    disableSignUp: !frontendSettings.enableEmailPasswordSignup,
  },
  socialProviders: {},
  trustedOrigins: [
    "http://localhost:9000",
    "http://192.168.1.*:9000",
    frontendSettings.origin,
  ],
  advanced: {
    cookiePrefix: "riven",
    database: {
      generateId: false as const,
    },
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
} satisfies BetterAuthOptions;

export let auth: Auth<
  typeof authConfig & { database: AdapterFactory<BetterAuthOptions> }
>;

export function initAuth(orm: MikroORM): typeof auth {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return (auth ??= betterAuth({
    ...authConfig,
    database: mikroOrmAdapter(orm),
  }));
}
