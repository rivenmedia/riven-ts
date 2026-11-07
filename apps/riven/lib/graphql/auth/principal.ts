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

/**
 * Identifies the caller from the request's `Authorization` header or session cookie.
 *
 * A bearer token other than the API key is checked as a better-auth session token,
 * so the frontend can forward its session cookie as an authorisation header.
 * A missing or invalid credential identifies the caller as anonymous.
 */
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

    // Decoding first accepts the cookie value raw or URL-encoded,
    // and encoding stops a `;` in the token from adding cookies.
    sessionHeaders.set(
      "cookie",
      `${authCookies.sessionToken.name}=${encodeURIComponent(decodeToken(token))}`,
    );
  }

  const session = await auth.api.getSession({
    headers: sessionHeaders,
    // The cached session in the `session_data` cookie can be up to a minute old,
    // which would delay a ban or role change.
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
