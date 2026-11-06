import { expect, vi } from "vitest";
import { createEmptyActor, toPromise } from "xstate";

import { deadStreamLinkScenario } from "#mocks/scenarios/dead-stream-link.scenario.ts";
import * as runtimeSettingsModule from "#utilities/runtime-settings.ts";

import { it } from "./helpers/test-context.ts";

it.override({
  input: {
    rootRef: createEmptyActor(),
    mainRunnerRef: createEmptyActor(),
    mockScenario: deadStreamLinkScenario,
  },
});

it("loads the runtime settings before applying the mock scenario", async ({
  actor,
}) => {
  // The test setup pre-initialises the runtime settings; simulate a real boot,
  // where they are unavailable until bootstrap loads them.
  const realGetRuntimeSettings = runtimeSettingsModule.getRuntimeSettings;
  const initialiseSpy = vi.spyOn(
    runtimeSettingsModule,
    "initialiseRuntimeSettings",
  );

  vi.spyOn(runtimeSettingsModule, "getRuntimeSettings").mockImplementation(
    () => {
      if (initialiseSpy.mock.calls.length === 0) {
        throw new Error("Runtime settings accessed before they were loaded");
      }

      return realGetRuntimeSettings();
    },
  );

  const visitedStates: unknown[] = [];

  actor.subscribe(({ value }) => {
    if (visitedStates.at(-1) !== value) {
      visitedStates.push(value);
    }
  });

  await expect(toPromise(actor.start())).resolves.toBeDefined();

  expect(visitedStates).not.toContain("Errored");
  expect(visitedStates.indexOf("Loading runtime settings")).toBeGreaterThan(-1);
  expect(visitedStates.indexOf("Loading runtime settings")).toBeLessThan(
    visitedStates.indexOf("Applying mock scenario"),
  );
});
