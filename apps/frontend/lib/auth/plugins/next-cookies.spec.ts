// @vitest-environment node
import assert from "node:assert";
import { expect, it, vi } from "vitest";

import { nextCookiesClientPlugin } from "./next-cookies.ts";

const nextHeaders = vi.hoisted(() => ({
  cookieStore: {
    set: vi.fn<(name: string, value: string, options: unknown) => void>(),
    toString: vi.fn<() => string>(() => "riven.session_token=abc"),
  },
  requestHeaders: new Map<string, string>(),
  cookiesError: null as Error | null,
}));

vi.mock(import("next/headers"), () => ({
  cookies: async () => {
    if (nextHeaders.cookiesError) {
      throw nextHeaders.cookiesError;
    }

    return Promise.resolve(nextHeaders.cookieStore as never);
  },
  headers: async () => Promise.resolve(nextHeaders.requestHeaders as never),
}));

function getHooks() {
  const [plugin] = nextCookiesClientPlugin.fetchPlugins;

  assert.ok(plugin);

  return plugin.hooks;
}

const onRequest = async (url: string, headers: Headers) =>
  getHooks().onRequest({ url, headers } as never);

const onSuccess = async (setCookie: string | null) =>
  getHooks().onSuccess({
    response: new Response(null, {
      headers: setCookie ? { "set-cookie": setCookie } : {},
    }),
  } as never);

it.beforeEach(() => {
  nextHeaders.cookieStore.set.mockReset();
  nextHeaders.requestHeaders.clear();

  nextHeaders.cookiesError = null;
});

it("forwards the incoming request headers and cookies to Better Auth", async () => {
  nextHeaders.requestHeaders.set("user-agent", "Mozilla/5.0");
  nextHeaders.requestHeaders.set("x-forwarded-for", "riven.example.net");
  nextHeaders.requestHeaders.set("Content-Type", "text/html");
  nextHeaders.requestHeaders.set("content-length", "123");
  nextHeaders.requestHeaders.set("cookie", "stale=cookie");
  nextHeaders.requestHeaders.set("origin", "https://riven.example.com");

  const headers = new Headers();

  await onRequest("http://localhost:8080/api/auth/get-session", headers);

  expect(Object.fromEntries(headers)).toStrictEqual({
    "user-agent": "Mozilla/5.0",
    "x-forwarded-for": "riven.example.net",
    origin: "https://riven.example.com",
    cookie: "riven.session_token=abc",
  });
});

it("uses the origin the browser addressed when the incoming request has none", async () => {
  nextHeaders.requestHeaders.set("host", "localhost:9000");
  nextHeaders.requestHeaders.set("x-forwarded-host", "riven.example.com");
  nextHeaders.requestHeaders.set("x-forwarded-proto", "https");

  const headers = new Headers();

  await onRequest("http://127.0.0.1:3000/api/auth/get-session", headers);

  expect(headers.get("origin")).toBe("https://riven.example.com");
});

it("uses the incoming request's host when it wasn't forwarded", async () => {
  nextHeaders.requestHeaders.set("host", "localhost:9000");

  const headers = new Headers();

  await onRequest("http://127.0.0.1:3000/api/auth/get-session", headers);

  expect(headers.get("origin")).toBe("http://localhost:9000");
});

it("uses the auth server's origin when the incoming request has no host", async () => {
  const headers = new Headers();

  await onRequest("http://localhost:8080/api/auth/get-session", headers);

  expect(headers.get("origin")).toBe("http://localhost:8080");
});

it("stores each cookie that Better Auth sets", async () => {
  await onSuccess(
    "riven.session_token=new-token; Path=/; HttpOnly, riven.session_data=data; Path=/; Max-Age=60",
  );

  expect(nextHeaders.cookieStore.set.mock.calls).toStrictEqual([
    [
      "riven.session_token",
      "new-token",
      expect.objectContaining({ path: "/", httpOnly: true }),
    ],
    [
      "riven.session_data",
      "data",
      expect.objectContaining({ path: "/", maxAge: 60 }),
    ],
  ]);
});

it("keeps storing cookies after one cannot be stored", async () => {
  nextHeaders.cookieStore.set.mockImplementationOnce(() => {
    throw new Error("Cookies can only be modified in a Server Action");
  });

  await onSuccess("first=1; Path=/, second=2; Path=/");

  expect(
    nextHeaders.cookieStore.set.mock.calls.map(([name]) => name),
  ).toStrictEqual(["first", "second"]);
});

it("does nothing when Better Auth sets no cookies", async () => {
  await onSuccess(null);

  expect(nextHeaders.cookieStore.set).not.toHaveBeenCalled();
});

it("ignores responses outside a request scope", async () => {
  nextHeaders.cookiesError = new Error(
    "`cookies` was called outside a request scope.",
  );

  await expect(onSuccess("first=1; Path=/")).resolves.toBeUndefined();
});

it("rethrows unexpected errors whilst storing cookies", async () => {
  nextHeaders.cookiesError = new Error("Unexpected failure");

  await expect(onSuccess("first=1; Path=/")).rejects.toThrow(
    "Unexpected failure",
  );
});

it("leaves requests and responses untouched in the browser", async () => {
  vi.stubGlobal("window", {});

  try {
    nextHeaders.requestHeaders.set("user-agent", "Mozilla/5.0");

    const headers = new Headers();

    await onRequest("http://localhost:8080/api/auth/get-session", headers);
    await onSuccess("first=1; Path=/");

    expect([...headers]).toStrictEqual([]);
    expect(nextHeaders.cookieStore.set).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllGlobals();
  }
});
