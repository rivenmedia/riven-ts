import { setGlobalDispatcher } from "undici";
import { fromPromise } from "xstate";

import { database } from "../../../database/database.ts";
import { mockAgent } from "../../../mocks/utilities/mock-agent.ts";

import type { MockScenario } from "../../../mocks/utilities/mock-scenario.ts";

export interface ApplyMockScenarioInput {
  mockScenario: MockScenario;
}

export const applyMockScenario = fromPromise<undefined, ApplyMockScenarioInput>(
  async ({ input: { mockScenario } }) => {
    await database.orm.schema.refresh();

    await mockScenario.seed(database.orm.em.fork());

    mockAgent.disableNetConnect();

    setGlobalDispatcher(mockAgent);
  },
);
