import { parseSetCookieHeader, toCookieOptions } from "better-auth/cookies";

import type { BetterAuthClientPlugin } from "better-auth";

/**
 * Whether the error was caused by the Next.js cookie store being unavailable,
 * e.g. when called outside of a request scope.
 */
function isUnavailableCookieStoreError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.startsWith(
      "`cookies` was called outside a request scope.",
    ) ||
      error.message.includes("Cannot find module"))
  );
}

async function setResponseCookies(
  parsedCookies: ReturnType<typeof parseSetCookieHeader>,
) {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  for (const [key, value] of parsedCookies) {
    if (!key) {
      continue;
    }

    try {
      cookieStore.set(key, value.value, toCookieOptions(value));
    } catch {
      /* empty */
    }
  }
}

/**
 * Custom Better Auth plugin to handle Next.js cookies in server-side requests and responses.
 *
 * This plugin ensures that cookies are correctly forwarded from the client to the server and vice versa,
 * maintaining session integrity across requests.
 */
export const nextCookiesClientPlugin = {
  id: "next-cookies-request",
  fetchPlugins: [
    {
      id: "next-cookies-request-plugin",
      name: "next-cookies-request-plugin",
      hooks: {
        async onRequest(ctx) {
          // oxlint-disable-next-line unicorn/prefer-global-this
          if (typeof window === "undefined") {
            const { cookies, headers } = await import("next/headers");
            const headersStore = await headers();
            const cookieStore = await cookies();
            const excludedHeaders = new Set([
              "content-length",
              "content-type",
              "cookie",
            ]);

            // Forward request headers to the Better Auth client request
            for (const [header, value] of headersStore) {
              if (excludedHeaders.has(header.toLowerCase())) {
                continue;
              }

              ctx.headers.set(header, value);
            }

            ctx.headers.set("cookie", cookieStore.toString());
          }
        },
        async onSuccess(ctx) {
          // oxlint-disable-next-line unicorn/prefer-global-this
          if (typeof window !== "undefined") {
            return;
          }

          const setCookies = ctx.response.headers.get("set-cookie");

          if (!setCookies) {
            return;
          }

          const parsedCookies = parseSetCookieHeader(setCookies);

          try {
            await setResponseCookies(parsedCookies);
          } catch (error) {
            if (isUnavailableCookieStoreError(error)) {
              return;
            }

            throw error;
          }
        },
      },
    },
  ],
} satisfies BetterAuthClientPlugin;
