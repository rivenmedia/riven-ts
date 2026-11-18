import { UserRole } from "@repo/util-auth/access-control";

import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

import { auth } from "#auth/auth.ts";
import { settings } from "#utilities/settings.ts";

export type Principal =
  | { kind: "anonymous" }
  | { kind: "service" }
  | { kind: "user"; userId: string; role: UserRole };

const salt = randomBytes(16);

function createDigest(token: string) {
  // oxlint-disable-next-line node/no-sync
  return pbkdf2Sync(token, salt, 100_000, 32, "sha256");
}

const apiKeyDigest = createDigest(settings.apiKey);

// Comparing digests gives `timingSafeEqual` inputs of equal length,
// so a wrong key's length cannot short-circuit the comparison.
function isApiKey(token: string) {
  return timingSafeEqual(createDigest(token), apiKeyDigest);
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

  if (token !== undefined && isApiKey(token)) {
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
