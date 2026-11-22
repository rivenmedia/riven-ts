import { fromPromise } from "xstate";

import { database, services } from "#database/database.ts";
import { loadRuntimeSettings } from "#state-machines/bootstrap/actors/load-runtime-settings.actor.ts";
import { coreEnvironment } from "#utilities/settings.ts";

import type { MockScenario } from "#mocks/utilities/mock-scenario.ts";

export interface ApplyMockScenarioInput {
  mockScenario: MockScenario;
}

export const applyMockScenario = fromPromise<undefined, ApplyMockScenarioInput>(
  async ({ input: { mockScenario } }) => {
    await database.orm.schema.refresh();

    await mockScenario.seed(database.orm.em.fork());

    // The scenario may have stored settings, such as the enabled plugins, that were loaded before it was applied
    await loadRuntimeSettings({
      settingsService: services.settingsService,
      environment: coreEnvironment,
    });
  },
);
