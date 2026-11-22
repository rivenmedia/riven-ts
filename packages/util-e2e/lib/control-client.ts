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
  };
}
