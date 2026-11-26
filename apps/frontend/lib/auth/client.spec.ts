// @vitest-environment jsdom
// @vitest-environment-options {"url": "http://example.test/"}
import { expect, it, vi } from "vitest";

it("uses the page's origin in the browser", async () => {
  const fetchSpy = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(Response.json({ token: "token", user: null }));

  // The auth client keeps the `fetch` it finds when created, so it's created after the spy
  const { authClient } = await import("./client.ts");

  await authClient.signIn.username({ username: "joe", password: "secret" });

  const [request] = fetchSpy.mock.calls[0] ?? [];

  expect(String(request instanceof Request ? request.url : request)).toBe(
    "http://example.test/api/auth/sign-in/username",
  );
});
