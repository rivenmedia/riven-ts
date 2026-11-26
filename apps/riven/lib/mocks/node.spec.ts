import { HttpResponse, http } from "msw/http";
// oxlint-disable sonarjs/no-clear-text-protocols -- MSW intercepts these in-process, or they go to a local server
import { once } from "node:events";
import { createServer } from "node:http";
import {
  Agent,
  getGlobalDispatcher,
  interceptors,
  request,
  setGlobalDispatcher,
} from "undici";
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
 * Starts a real HTTP server on 127.0.0.1, so a test can tell whether a request reached it.
 */
async function startServer() {
  const receivedPaths: string[] = [];
  const server = createServer((req, res) => {
    receivedPaths.push(req.url ?? "");
    res.end("ok");
  });

  onTestFinished(() => {
    server.closeAllConnections();
    server.close();
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address();

  expect.assert(address !== null && typeof address === "object");

  const port = String(address.port);

  return {
    loopbackUrl: `http://127.0.0.1:${port}/`,
    // The IPv4-mapped IPv6 address reaches the same listener, but isn't one of
    // test mode's loopback hosts, so it stands in for an external host. Every
    // platform has 127.0.0.1, unlike other 127.0.0.0/8 addresses (macOS has no
    // 127.0.0.2).
    externalUrl: new URL(`http://[::ffff:127.0.0.1]:${port}/`).href,
    receivedPaths,
  };
}

it("reaches a local server through its external URL without mocks", async () => {
  const listener = await startServer();

  const fetched = await fetch(listener.externalUrl);

  expect(fetched.status).toBe(200);

  const requested = await request(listener.externalUrl);

  expect(requested.statusCode).toBe(200);
  await requested.body.dump();

  expect(listener.receivedPaths).toStrictEqual(["/", "/"]);
});

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
  const listener = await startServer();

  await expect(fetch(listener.externalUrl)).rejects.toThrow(/fetch failed/u);

  expect(listener.receivedPaths).toStrictEqual([]);
  expect(unhandledRequests.list()).toStrictEqual([
    { method: "GET", url: listener.externalUrl },
  ]);
});

it("records each attempt when the caller retries an unhandled request in test mode", async () => {
  const { unhandledRequests } = await importInTestMode();
  const listener = await startServer();
  const previousDispatcher = getGlobalDispatcher();

  onTestFinished(() => {
    setGlobalDispatcher(previousDispatcher);
  });

  // Riven's VFS sets a retrying global dispatcher, which `fetch` uses too. Each retry is a separate request.
  setGlobalDispatcher(
    new Agent().compose(interceptors.retry({ maxRetries: 2, minTimeout: 1 })),
  );

  await expect(fetch(listener.externalUrl)).rejects.toThrow(/fetch failed/u);

  expect(listener.receivedPaths).toStrictEqual([]);
  expect(unhandledRequests.list()).toStrictEqual([
    { method: "GET", url: listener.externalUrl },
    { method: "GET", url: listener.externalUrl },
    { method: "GET", url: listener.externalUrl },
  ]);
});

it("fails and records unhandled external undici requests in test mode", async () => {
  const { unhandledRequests } = await importInTestMode();
  const listener = await startServer();

  await expect(request(listener.externalUrl)).rejects.toThrow(/Network error/u);

  expect(listener.receivedPaths).toStrictEqual([]);
  expect(unhandledRequests.list()).toStrictEqual([
    { method: "GET", url: listener.externalUrl },
  ]);
});

it("passes unhandled loopback requests through in test mode", async () => {
  const { unhandledRequests } = await importInTestMode();
  const listener = await startServer();

  const fetched = await fetch(listener.loopbackUrl);

  expect(fetched.status).toBe(200);

  const requested = await request(listener.loopbackUrl);

  expect(requested.statusCode).toBe(200);
  await requested.body.dump();

  expect(listener.receivedPaths).toStrictEqual(["/", "/"]);
  expect(unhandledRequests.list()).toStrictEqual([]);
});
