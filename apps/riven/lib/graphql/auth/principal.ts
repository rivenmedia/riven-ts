import { UserRole } from "@repo/util-auth/access-control";

import { auth } from "#auth/auth.ts";
import { isApiKey, readBearerToken } from "#graphql/auth/api-key.ts";

export type Principal =
  | { kind: "anonymous" }
  | { kind: "service" }
  | { kind: "user"; userId: string; role: UserRole };

function decodeToken(token: string) {
  try {
    return decodeURIComponent(token);
  } catch {
    return token;
  }
}

export async function resolvePrincipal(headers: Headers): Promise<Principal> {
  const token = readBearerToken(headers.get("authorization"));

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
