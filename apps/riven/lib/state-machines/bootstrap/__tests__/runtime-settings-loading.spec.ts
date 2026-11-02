import { expect } from "vitest";
import { toPromise } from "xstate";

import { CORE_NAMESPACE } from "#settings/core-settings-sections.ts";
import { getRuntimeSettings } from "#utilities/runtime-settings.ts";

import { it } from "./helpers/test-context.ts";

it("loads the stored runtime settings before bootstrapping plugins", async ({
  actor,
  services,
}) => {
  await services.settingsService.writeValues(CORE_NAMESPACE, {
    upsert: { dubbedAnimeOnly: true },
    delete: [],
  });

  const visitedStates: unknown[] = [];

  actor.subscribe(({ value }) => {
    if (visitedStates.at(-1) !== value) {
      visitedStates.push(value);
    }
  });

  await toPromise(actor.start());

  expect(getRuntimeSettings().general.scraping.dubbedAnimeOnly).toBe(true);
  expect(visitedStates.indexOf("Loading runtime settings")).toBeLessThan(
    visitedStates.indexOf("Bootstrapping plugins"),
  );
  expect(visitedStates).toContain("Loading runtime settings");
});
