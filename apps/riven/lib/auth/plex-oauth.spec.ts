import { HttpResponse, http } from "msw/http";
import assert from "node:assert";
import { expect, vi } from "vitest";

import { it } from "#__tests__/test-context.ts";
import { logger } from "#utilities/logger/logger.ts";

import { plexOAuth } from "./plex-oauth.ts";

const PIN_URL = "https://plex.tv/api/v2/pins/:pinId";
const USER_URL = "https://plex.tv/api/v2/user";

const tokenRequest = {
  redirectURI: "https://riven.test/api/plex/callback",
} as const;

const UNAUTHORIZED = () => new HttpResponse(null, { status: 401 });

const hasHeaders = (request: Request, expected: Record<string, string>) =>
  Object.entries(expected).every(
    ([name, value]) => request.headers.get(name) === value,
  );

const getToken = (options: Parameters<typeof plexOAuth>[0]) => {
  const { getToken: exchange } = plexOAuth(options);

  assert.ok(exchange);

  return exchange;
};

const getUserInfo = (options: Parameters<typeof plexOAuth>[0]) => {
  const { getUserInfo: fetchUserInfo } = plexOAuth(options);

  assert.ok(fetchUserInfo);

  return fetchUserInfo;
};

it("requires a client ID", () => {
  expect(() => plexOAuth({ clientId: "" })).toThrow(
    "Client ID is required for Plex OAuth provider",
  );
});

it("points the authorisation and callback URLs at the Plex PIN flow endpoints", () => {
  expect(
    plexOAuth({
      clientId: "client-id",
      baseURL: "https://riven.test",
      disableSignUp: true,
    }),
  ).toMatchObject({
    providerId: "plex",
    clientId: "client-id",
    clientSecret: "not-used",
    authorizationUrl: "https://riven.test/api/plex/authorize",
    tokenUrl: "https://plex.tv/api/v2/pins",
    redirectURI: "https://riven.test/api/plex/callback",
    scopes: [],
    disableSignUp: true,
  });
});

it("uses relative endpoint URLs when no base URL is given", () => {
  expect(plexOAuth({ clientId: "client-id" })).toMatchObject({
    authorizationUrl: "/api/plex/authorize",
    redirectURI: "/api/plex/callback",
  });
});

it("rejects a token exchange code without a PIN code", async () => {
  const exchange = getToken({ clientId: "client-id" });

  await expect(exchange({ ...tokenRequest, code: "1234" })).rejects.toThrow(
    "Invalid PIN code format, expected pinId:pinCode",
  );
});

it.for(["1234:", ":abcd"])(
  "rejects a token exchange code with an empty PIN part (%s)",
  async (code) => {
    const exchange = getToken({ clientId: "client-id" });

    await expect(exchange({ ...tokenRequest, code })).rejects.toThrow(
      "PIN ID and PIN code are required for token exchange",
    );
  },
);

it("exchanges an authorised PIN for its auth token using the default Plex headers", async ({
  server,
}) => {
  const pin = { id: 1234, code: "abcd", authToken: "plex-auth-token" };

  server.use(
    http.get(PIN_URL, ({ params, request }) => {
      if (
        params["pinId"] !== "1234" ||
        !hasHeaders(request, {
          "x-plex-product": "Riven Media",
          "x-plex-version": "1.0",
          "x-plex-client-identifier": "client-id",
          "x-plex-platform": "Web",
          "x-plex-device": "Browser",
          "x-plex-token": "abcd",
          accept: "application/json",
        })
      ) {
        return UNAUTHORIZED();
      }

      return HttpResponse.json(pin);
    }),
  );

  const exchange = getToken({ clientId: "client-id" });

  await expect(
    exchange({ ...tokenRequest, code: "1234:abcd" }),
  ).resolves.toStrictEqual({
    accessToken: "plex-auth-token",
    tokenType: "Bearer",
    accessTokenExpiresAt: undefined,
    refreshToken: undefined,
    scopes: [],
    raw: pin,
  });
});

it("sends the configured product details to Plex", async ({ server }) => {
  server.use(
    http.get(PIN_URL, ({ request }) => {
      if (
        !hasHeaders(request, {
          "x-plex-product": "Custom Product",
          "x-plex-version": "2.5",
          "x-plex-platform": "iOS",
          "x-plex-device": "iPhone",
        })
      ) {
        return UNAUTHORIZED();
      }

      return HttpResponse.json({ authToken: "plex-auth-token" });
    }),
  );

  const exchange = getToken({
    clientId: "client-id",
    product: "Custom Product",
    version: "2.5",
    platform: "iOS",
    device: "iPhone",
  });

  await expect(
    exchange({ ...tokenRequest, code: "1234:abcd" }),
  ).resolves.toMatchObject({ accessToken: "plex-auth-token" });
});

it("rejects a PIN that the user has not authorised yet", async ({ server }) => {
  server.use(
    http.get(PIN_URL, () => HttpResponse.json({ id: 1234, authToken: null })),
  );

  const exchange = getToken({ clientId: "client-id" });

  await expect(
    exchange({ ...tokenRequest, code: "1234:abcd" }),
  ).rejects.toThrow(
    "No auth token in PIN response - user may not have authorized",
  );
});

it("rejects the token exchange when Plex fails to return the PIN", async ({
  server,
}) => {
  server.use(http.get(PIN_URL, () => new HttpResponse(null, { status: 404 })));

  const exchange = getToken({ clientId: "client-id" });

  await expect(
    exchange({ ...tokenRequest, code: "1234:abcd" }),
  ).rejects.toThrow("Failed to check PIN status");
});

it("returns no user info without an access token", async ({ server }) => {
  const userRequest = vi.fn<() => Response>(() => HttpResponse.json({}));

  server.use(http.get(USER_URL, userRequest));

  const fetchUserInfo = getUserInfo({ clientId: "client-id" });

  await expect(fetchUserInfo({})).resolves.toBeNull();

  expect(userRequest).not.toHaveBeenCalled();
});

it("maps the Plex profile to user info using the auth token", async ({
  server,
}) => {
  server.use(
    http.get(USER_URL, ({ request }) => {
      if (!hasHeaders(request, { "x-plex-token": "plex-auth-token" })) {
        return UNAUTHORIZED();
      }

      return HttpResponse.json({
        id: 42,
        title: "Plex Display Name",
        username: "plex-username",
        email: "user@example.com",
        thumb: "https://plex.tv/users/42/avatar",
        emailOnlyAuth: true,
      });
    }),
  );

  const fetchUserInfo = getUserInfo({ clientId: "client-id" });

  await expect(
    fetchUserInfo({ accessToken: "plex-auth-token" }),
  ).resolves.toStrictEqual({
    id: "42",
    name: "Plex Display Name",
    email: "user@example.com",
    image: "https://plex.tv/users/42/avatar",
    emailVerified: true,
  });
});

it("falls back to the Plex username when the profile has no title", async ({
  server,
}) => {
  server.use(
    http.get(USER_URL, () =>
      HttpResponse.json({
        id: 42,
        title: "",
        username: "plex-username",
        email: "user@example.com",
        thumb: "https://plex.tv/users/42/avatar",
        emailOnlyAuth: false,
      }),
    ),
  );

  const fetchUserInfo = getUserInfo({ clientId: "client-id" });

  await expect(
    fetchUserInfo({ accessToken: "plex-auth-token" }),
  ).resolves.toMatchObject({ name: "plex-username", emailVerified: false });
});

it("logs and returns no user info when Plex fails to return the profile", async ({
  server,
}) => {
  const errorSpy = vi.spyOn(logger, "error").mockReturnValue(logger);

  server.use(http.get(USER_URL, () => new HttpResponse(null, { status: 401 })));

  const fetchUserInfo = getUserInfo({ clientId: "client-id" });

  await expect(
    fetchUserInfo({ accessToken: "plex-auth-token" }),
  ).resolves.toBeNull();

  expect(errorSpy).toHaveBeenCalledWith(
    "Failed to fetch user info from Plex:",
    expect.objectContaining({
      message: "Failed to fetch user info from Plex: 401",
    }),
  );
});
