import { parseSetCookieHeader, toCookieOptions } from "better-auth/cookies";

import type { BetterAuthClientPlugin } from "better-auth";

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
          if (typeof window === "undefined") {
            const { cookies, headers } = await import("next/headers");
            const headersStore = await headers();
            const cookieStore = await cookies();
            const excludedHeaders = [
              "content-length",
              "content-type",
              "cookie",
            ];

            // Forward request headers to the Better Auth client request
            for (const [header, value] of headersStore) {
              if (excludedHeaders.includes(header.toLowerCase())) {
                continue;
              }

              ctx.headers.set(header, value);
            }

            ctx.headers.set("cookie", cookieStore.toString());
          }
        },
        async onSuccess(ctx) {
          if (typeof window === "undefined") {
            const setCookies = ctx.response.headers.get("set-cookie");

            if (!setCookies) {
              return;
            }

            const parsed = parseSetCookieHeader(setCookies);

            try {
              const { cookies } = await import("next/headers");
              const cookieStore = await cookies();

              for (const [key, value] of parsed) {
                if (!key) {
                  continue;
                }

                try {
                  cookieStore.set(key, value.value, toCookieOptions(value));
                } catch {
                  /* empty */
                }
              }
            } catch (error) {
              if (
                error instanceof Error &&
                (error.message.startsWith(
                  "`cookies` was called outside a request scope.",
                ) ||
                  error.message.includes("Cannot find module"))
              ) {
                return;
              }

              throw error;
            }

            return;
          }
        },
      },
    },
  ],
} satisfies BetterAuthClientPlugin;
