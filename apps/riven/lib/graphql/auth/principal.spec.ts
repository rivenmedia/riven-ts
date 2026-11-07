import { RequestContext } from "@mikro-orm/core";
import { getSessionCookie } from "better-auth/cookies";
import assert from "node:assert";
import { randomBytes } from "node:crypto";
import { expect } from "vitest";

import { it as testContext } from "#__tests__/test-context.ts";
import { initAuth } from "#auth/auth.ts";
import { settings } from "#utilities/settings.ts";

import { resolvePrincipal } from "./principal.ts";

const it = testContext
  .extend("auth", ({ orm }) => initAuth(orm))
  .extend(
    "resolve",
    ({ orm, auth: _auth }) =>
      async (headers: Record<string, string>) =>
        RequestContext.create(orm.em, async () =>
          resolvePrincipal(new Headers(headers)),
        ),
  )
  .extend("signedInUser", async ({ orm, auth }) => {
    const { headers, response } = await RequestContext.create(
      orm.em,
      async () =>
        auth.api.signUpEmail({
          body: {
            name: "Riven User",
            email: "user@riven.test",
            password: "correct horse battery staple",
          },
          returnHeaders: true,
        }),
    );

    // The browser's `Cookie` header, from the cookies that sign-up set.
    const cookie = headers
      .getSetCookie()
      .map((setCookie) => setCookie.split(";", 1)[0])
      .join("; ");

    // The frontend reads the token from that header the same way.
    const sessionToken = getSessionCookie(new Headers({ cookie }), {
      cookiePrefix: "riven",
    });

    assert.ok(sessionToken);

    return { userId: response.user.id, cookie, sessionToken };
  });

it("resolvePrincipal identifies the user from a session token sent as a bearer token", async ({
  resolve,
  signedInUser: { userId, sessionToken },
}) => {
  await expect(
    resolve({ authorization: `Bearer ${sessionToken}` }),
  ).resolves.toStrictEqual({ kind: "user", userId, role: "user" });
});

it("resolvePrincipal accepts the session token in its URL-encoded cookie form", async ({
  resolve,
  signedInUser: { userId, sessionToken },
}) => {
  await expect(
    resolve({ authorization: `Bearer ${encodeURIComponent(sessionToken)}` }),
  ).resolves.toStrictEqual({ kind: "user", userId, role: "user" });
});

it("resolvePrincipal identifies the user from the session cookie alone", async ({
  resolve,
  signedInUser: { userId, cookie },
}) => {
  await expect(resolve({ cookie })).resolves.toStrictEqual({
    kind: "user",
    userId,
    role: "user",
  });
});

it("resolvePrincipal treats a session token with a tampered signature as anonymous", async ({
  resolve,
  signedInUser: { sessionToken },
}) => {
  const signatureStart = sessionToken.lastIndexOf(".") + 1;
  const tamperedCharacter = sessionToken[signatureStart] === "A" ? "B" : "A";
  const tamperedToken = `${sessionToken.slice(0, signatureStart)}${tamperedCharacter}${sessionToken.slice(signatureStart + 1)}`;

  await expect(
    resolve({ authorization: `Bearer ${tamperedToken}` }),
  ).resolves.toStrictEqual({ kind: "anonymous" });
});

it("resolvePrincipal lets an invalid bearer token decide over a valid session cookie", async ({
  resolve,
  signedInUser: { cookie },
}) => {
  await expect(
    resolve({ authorization: "Bearer garbage", cookie }),
  ).resolves.toStrictEqual({ kind: "anonymous" });
});

it("resolvePrincipal identifies a service caller from the API key", async ({
  resolve,
}) => {
  await expect(
    resolve({ authorization: `Bearer ${settings.apiKey}` }),
  ).resolves.toStrictEqual({ kind: "service" });
});

it("resolvePrincipal treats a wrong API key as anonymous", async ({
  resolve,
}) => {
  await expect(
    resolve({
      authorization: `Bearer ${randomBytes(32).toString("base64url")}`,
    }),
  ).resolves.toStrictEqual({ kind: "anonymous" });
});

it("resolvePrincipal treats a request without credentials as anonymous", async ({
  resolve,
}) => {
  await expect(resolve({})).resolves.toStrictEqual({ kind: "anonymous" });
});
