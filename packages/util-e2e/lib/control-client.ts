import type { MockScenarioName } from "./scenario-names.ts";
import type { UnhandledRequest } from "./unhandled-request.ts";

/**
 * Calls a test-mode Riven's `/__e2e__` control endpoint.
 * Only imports types, so Playwright can load it without Riven's side effects.
 */
export function createE2eControlClient(rivenUrl: URL, apiKey: string) {
  async function request(method: string, path: string, body?: unknown) {
    const response = await fetch(new URL(`/__e2e__/${path}`, rivenUrl), {
      method,
      headers: {
        authorization: `Bearer ${apiKey}`,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: body === undefined ? null : JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `E2E control request ${method} /__e2e__/${path} failed with ${response.status.toString()}: ${await response.text()}`,
      );
    }

    return response;
  }

  return {
    /** Whether Riven has finished starting. Its API answers before then, but the events a request sends go unhandled. */
    async isStarted() {
      const response = await request("GET", "started");
      const { started } = (await response.json()) as { started: boolean };

      return started;
    },
    async applyScenario(name: MockScenarioName) {
      await request("POST", "scenario", { scenario: name });
    },
    async getUnhandledRequests() {
      const response = await request("GET", "unhandled-requests");
      const { requests } = (await response.json()) as {
        requests: UnhandledRequest[];
      };

      return requests;
    },
    /** Releases a gate the scenario holds a mocked response behind, so the response is sent */
    async releaseGate(key: string) {
      await request("POST", `gates/${encodeURIComponent(key)}/release`);
    },
  };
}
