import { startCase } from "es-toolkit";
import { z } from "zod";

import type { GenericOAuthConfig } from "better-auth/plugins";

/**
 * Configuration for a generic OAuth provider.
 * These are parsed from environment variables in the format:
 * OAUTH_PROVIDER_{PROVIDER_NAME}_{CONFIG_KEY}
 *
 * Example environment variables:
 * - OAUTH_PROVIDER_GOOGLE_CLIENT_ID=your-client-id
 * - OAUTH_PROVIDER_GOOGLE_CLIENT_SECRET=your-client-secret
 * - OAUTH_PROVIDER_GOOGLE_DISCOVERY_URL=https://accounts.google.com/.well-known/openid-configuration
 * - OAUTH_PROVIDER_GOOGLE_SCOPES=openid,email,profile
 * - OAUTH_PROVIDER_GOOGLE_PKCE=true
 * - OAUTH_PROVIDER_GOOGLE_NAME=Google
 * - OAUTH_PROVIDER_GOOGLE_ICON=https://example.com/google-icon.svg
 *
 * Or using ISSUER for auto-discovery:
 * - OAUTH_PROVIDER_KEYCLOAK_ISSUER=https://auth.example.com/realms/myrealm
 */
interface GenericOAuthProvider extends GenericOAuthConfig {
  /** Display name for the provider */
  name?: string;
  /** Icon URL for the provider */
  icon?: string;
}

interface NestedObject {
  [key: string]: NestedObject | string | undefined;
}

function unflattenObject(
  data: Record<string, string | undefined>,
  delimiter = "_",
): NestedObject {
  const result: NestedObject = {};

  for (const key in data) {
    if (!key.startsWith("OAUTH_PROVIDER_")) {
      continue;
    }

    const value = data[key];

    if (value === undefined) {
      continue;
    }

    const parts = key.split(delimiter);

    let current = result;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (!part) {
        continue;
      }

      const partKey = part.toLowerCase();

      if (i === parts.length - 1) {
        current[partKey] = value;
      } else {
        current[partKey] ??= {};
        current = current[partKey] as NestedObject;
      }
    }
  }

  return result;
}

const urlConfigSchema = z.object({ url: z.url().optional() });

const configSchema = z.object({
  oauth: z
    .object({
      provider: z
        .record(
          z.string(),
          z
            .object({
              client: z
                .object({
                  id: z.string().optional(),
                  secret: z.string().optional(),
                })
                .partial(),
              discovery: urlConfigSchema.optional(),
              issuer: z.url().optional(),
              scopes: z
                .string()
                .optional()
                .transform((val) =>
                  val?.split(",").map((scope) => scope.trim()),
                ),
              pkce: z.stringbool().default(false),
              disable: z
                .object({ signup: z.stringbool().default(false) })
                .optional(),
              redirect: z.object({ uri: z.url().optional() }).optional(),
              auth: urlConfigSchema.optional(),
              authorization: urlConfigSchema.optional(),
              token: urlConfigSchema.optional(),
              userinfo: urlConfigSchema.optional(),
              user: z.object({ info: urlConfigSchema.optional() }).optional(),
              name: z.string().optional(),
              icon: z.string().optional(),
            })
            .partial(),
        )
        .optional(),
    })
    .optional(),
});

export function getGenericOAuthProviders(
  env: NodeJS.ProcessEnv,
): GenericOAuthProvider[] {
  const parsedEnv = configSchema.safeParse(unflattenObject(env));

  if (!parsedEnv.success) {
    throw new Error("Invalid OAuth configuration");
  }

  const providersObj = parsedEnv.data.oauth?.provider;

  if (!providersObj) {
    return [];
  }

  const providers: GenericOAuthProvider[] = [];

  for (const [providerId, config] of Object.entries(providersObj)) {
    const { client: { id: clientId, secret: clientSecret } = {} } = config;

    if (clientId && clientSecret) {
      const discoveryUrl =
        config.discovery?.url ??
        (config.issuer
          ? `${config.issuer}/.well-known/openid-configuration`
          : undefined);

      providers.push({
        providerId,
        clientId,
        clientSecret,
        discoveryUrl,
        scopes: config.scopes,
        pkce: config.pkce,
        disableSignUp: config.disable?.signup ?? false,
        redirectURI: config.redirect?.uri,
        authorizationUrl: config.authorization?.url ?? config.auth?.url,
        tokenUrl: config.token?.url,
        userInfoUrl: config.userinfo?.url ?? config.user?.info?.url,
        name: config.name ?? startCase(providerId),
        icon: config.icon ?? "",
      });
    }
  }

  return providers;
}
