import { fromPromise } from "xstate";

import { database } from "../../../database/database.ts";

import type { MockScenario } from "../../../mocks/utilities/mock-scenario.ts";

export interface ApplyMockScenarioInput {
  mockScenario: MockScenario;
}

export const applyMockScenario = fromPromise<undefined, ApplyMockScenarioInput>(
  async ({ input: { mockScenario } }) => {
    await database.orm.schema.refresh();

    await mockScenario.seed(database.orm.em.fork());
  },
);
