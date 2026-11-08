import { createHash, timingSafeEqual } from "node:crypto";

import { auth } from "#auth/auth.ts";
import { settings } from "#utilities/settings.ts";

export type Principal =
  | { kind: "anonymous" }
  | { kind: "service" }
  | { kind: "user"; userId: string; role: string };

const bearerTokenPattern = /^Bearer +(?<token>\S+)$/iu;

function sha256(value: string) {
  return createHash("sha256").update(value).digest();
}

const apiKeyDigest = sha256(settings.apiKey);

// Comparing digests gives `timingSafeEqual` inputs of equal length,
// so a wrong key's length cannot short-circuit the comparison.
function isApiKey(token: string) {
  return timingSafeEqual(sha256(token), apiKeyDigest);
}

function decodeToken(token: string) {
  try {
    return decodeURIComponent(token);
  } catch {
    return token;
  }
}

export async function resolvePrincipal(headers: Headers): Promise<Principal> {
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
    role: session.user.role ?? "",
  };
}
