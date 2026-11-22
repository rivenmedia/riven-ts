import { HttpResponse, http } from "msw/http";
// oxlint-disable sonarjs/no-clear-text-protocols -- MSW intercepts these in-process, or they go to a local server
import { once } from "node:events";
import { createServer } from "node:http";
import { request } from "undici";
import { expect, it, onTestFinished, vi } from "vitest";

import { MockScenario } from "./utilities/mock-scenario.ts";

it("refuses to start under NODE_ENV=production", async () => {
  vi.resetModules();
  onTestFinished(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("./scenarios/index.ts");
  });
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("MOCK_SCENARIO", "dead-stream-link");

  await expect(import("./node.ts")).rejects.toThrow(
    /only be enabled in development or test/u,
  );
});

it("rejects scenarios that set environment data in test mode", async () => {
  vi.resetModules();
  onTestFinished(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("./scenarios/index.ts");
  });
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("MOCK_SCENARIO", "dead-stream-link");

  await expect(import("./node.ts")).rejects.toThrow(
    /can't set environment data in test mode/u,
  );
});

/**
 * Imports `node.ts` in test mode, with a scenario that handles `http://handled.invalid/`.
 */
async function importInTestMode() {
  class TestScenario extends MockScenario {
    public override scenarioName = "dead-stream-link" as const;

    public override handlers = [
      http.get("http://handled.invalid/", () => HttpResponse.text("ok")),
    ] as const;
  }

  vi.resetModules();
  onTestFinished(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("./scenarios/index.ts");
  });
  vi.doMock(import("./scenarios/index.ts"), async (importOriginal) => {
    const original = await importOriginal();
    const scenarios = {
      ...original.scenarios,
      "dead-stream-link": new TestScenario(),
    };

    return { scenarios };
  });
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("MOCK_SCENARIO", "dead-stream-link");

  const { server } = await import("./node.ts");
  const { unhandledRequests } =
    await import("./utilities/unhandled-requests.ts");

  onTestFinished(() => {
    server.close();
    unhandledRequests.clear();
  });

  return { unhandledRequests };
}

/**
 * Starts a real HTTP server on `host`, so a test can tell whether a request reached it.
 */
async function startServer(host: string) {
  const receivedPaths: string[] = [];
  const server = createServer((req, res) => {
    receivedPaths.push(req.url ?? "");
    res.end("ok");
  });

  onTestFinished(() => {
    server.closeAllConnections();
    server.close();
  });

  server.listen(0, host);
  await once(server, "listening");

  const address = server.address();

  expect.assert(address !== null && typeof address === "object");

  return { url: `http://${host}:${String(address.port)}/`, receivedPaths };
}

it("mocks handled fetch and undici requests in test mode", async () => {
  await importInTestMode();

  const fetched = await fetch("http://handled.invalid/");

  expect(fetched.status).toBe(200);

  const requested = await request("http://handled.invalid/");

  expect(requested.statusCode).toBe(200);
  await expect(requested.body.text()).resolves.toBe("ok");
});

it("fails and records unhandled external fetch requests in test mode", async () => {
  const { unhandledRequests } = await importInTestMode();
  const external = await startServer("127.0.0.2");

  await expect(fetch(external.url)).rejects.toThrow(/fetch failed/u);

  expect(external.receivedPaths).toStrictEqual([]);
  expect(unhandledRequests.list()).toStrictEqual([
    { method: "GET", url: external.url },
  ]);
});

it("fails and records unhandled external undici requests in test mode", async () => {
  const { unhandledRequests } = await importInTestMode();
  const external = await startServer("127.0.0.2");

  await expect(request(external.url)).rejects.toThrow(/Network error/u);

  expect(external.receivedPaths).toStrictEqual([]);
  expect(unhandledRequests.list()).toStrictEqual([
    { method: "GET", url: external.url },
  ]);
});

it("passes unhandled loopback requests through in test mode", async () => {
  const { unhandledRequests } = await importInTestMode();
  const loopback = await startServer("127.0.0.1");

  const fetched = await fetch(loopback.url);

  expect(fetched.status).toBe(200);

  const requested = await request(loopback.url);

  expect(requested.statusCode).toBe(200);
  await requested.body.dump();

  expect(loopback.receivedPaths).toStrictEqual(["/", "/"]);
  expect(unhandledRequests.list()).toStrictEqual([]);
});
