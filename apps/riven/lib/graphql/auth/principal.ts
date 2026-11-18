import { UserRole } from "@repo/util-auth/access-control";

import { pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { auth } from "#auth/auth.ts";
import { settings } from "#utilities/settings.ts";

export type Principal =
  | { kind: "anonymous" }
  | { kind: "service" }
  | { kind: "user"; userId: string; role: UserRole };

const salt = randomBytes(16);

async function createDigest(token: string) {
  return promisify(pbkdf2)(token, salt, 100_000, 32, "sha256");
}

const apiKeyDigest = await createDigest(settings.apiKey);

// Comparing digests gives `timingSafeEqual` inputs of equal length,
// so a wrong key's length cannot short-circuit the comparison.
async function isApiKey(token: string) {
  const comparator = await createDigest(token);

  return timingSafeEqual(comparator, apiKeyDigest);
}

function decodeToken(token: string) {
  try {
    return decodeURIComponent(token);
  } catch {
    return token;
  }
}

export async function resolvePrincipal(headers: Headers): Promise<Principal> {
  const bearerTokenPattern = /^Bearer +(?<token>\S+)$/iu;
  const token = bearerTokenPattern.exec(
    headers.get("authorization")?.trim() ?? "",
  )?.groups?.["token"];

  if (token !== undefined && (await isApiKey(token))) {
    return { kind: "service" };
  }

  const sessionHeaders = new Headers(headers);

  if (token !== undefined) {
    const { authCookies } = await auth.$context;

    sessionHeaders.set(
      "cookie",
      `${authCookies.sessionToken.name}=${encodeURIComponent(decodeToken(token))}`,
    );
  }

  const session = await auth.api.getSession({
    headers: sessionHeaders,
    query: { disableCookieCache: true },
  });

  if (!session) {
    return { kind: "anonymous" };
  }

  return {
    kind: "user",
    userId: session.user.id,
    role: UserRole.parse(session.user.role),
  };
}
