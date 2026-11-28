import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { expect } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { authConfig } from "#auth/auth.ts";

/**
 * Signs out with Riven's auth, as if Riven were bound to `host`.
 * Riven trusts its own base URL implicitly, and that depends on the host.
 */
const it = baseIt.extend(
  "signOut",
  () =>
    async (headers: Record<string, string>, host = "127.0.0.1") => {
      const baseURL = `http://${host}:3000`;
      const auth = betterAuth({
        ...authConfig,
        baseURL,
        database: memoryAdapter({}),
        // Better Auth skips the origin check in tests unless it's enabled explicitly
        advanced: { ...authConfig.advanced, disableOriginCheck: false },
      });

      return auth.handler(
        new Request(`${baseURL}/api/auth/sign-out`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            // Better Auth only checks the origin of requests that carry cookies
            cookie: "riven.session_token=token",
            ...headers,
          },
          body: "{}",
        }),
      );
    },
);

it.for(["127.0.0.1", "0.0.0.0"])(
  "accepts requests from the host the frontend forwarded, when bound to %s",
  async (host, { signOut }) => {
    const response = await signOut(
      {
        origin: "https://riven.example.com",
        "x-forwarded-host": "riven.example.com",
        "x-forwarded-proto": "https",
      },
      host,
    );

    expect(response.status).toBe(200);
  },
);

it("rejects cross-site requests to a forwarded host", async ({ signOut }) => {
  const response = await signOut({
    origin: "https://attacker.example.com",
    "x-forwarded-host": "riven.example.com",
    "x-forwarded-proto": "https",
  });

  expect(response.status).toBe(403);
});
