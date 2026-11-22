// oxlint-disable sonarjs/no-clear-text-protocols -- MSW intercepts these in-process; nothing leaves the machine
import { HttpResponse, http } from "msw/http";
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

it("records and errors unhandled requests in test mode", async () => {
  class TestScenario extends MockScenario {
    public override scenarioName = "e2e-baseline";

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
      "e2e-baseline": new TestScenario(),
    };

    return { scenarios };
  });
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("MOCK_SCENARIO", "e2e-baseline");

  const { server } = await import("./node.ts");
  const { unhandledRequests } =
    await import("./utilities/unhandled-requests.ts");

  onTestFinished(() => {
    server.close();
    unhandledRequests.clear();
  });

  const handled = await fetch("http://handled.invalid/");

  expect(handled.status).toBe(200);

  await expect(fetch("http://unhandled.invalid/")).rejects.toThrow(
    /fetch failed/u,
  );

  expect(unhandledRequests.list()).toStrictEqual([
    { method: "GET", url: "http://unhandled.invalid/", source: "msw" },
  ]);
});
