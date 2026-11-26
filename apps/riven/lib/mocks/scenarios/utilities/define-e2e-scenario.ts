import { MockScenario } from "#mocks/utilities/mock-scenario.ts";

import { e2eBaselineScenario } from "../e2e-baseline.scenario.ts";

import type { EntityManager } from "@mikro-orm/core";
import type { MockScenarioName } from "@repo/util-e2e";
import type { AnyHandler } from "msw";

interface E2eScenarioDefinition<Name extends MockScenarioName> {
  scenarioName: Name;

  /** Runs after the baseline's seed */
  seed?: (em: EntityManager) => Promise<void>;

  /** Answers requests before the baseline's handlers do */
  handlers?: readonly [AnyHandler, ...AnyHandler[]];
}

/**
 * Defines an E2E scenario as the baseline plus its own seed and handlers.
 *
 * It seeds the baseline first, and lists its own handlers first, as MSW uses the first one that matches a request.
 */
export const defineE2eScenario = <Name extends MockScenarioName>({
  scenarioName,
  seed,
  handlers,
}: E2eScenarioDefinition<Name>): MockScenario & {
  readonly scenarioName: Name;
} => {
  class E2eScenario extends MockScenario {
    public override scenarioName = scenarioName;

    public override handlers: readonly [AnyHandler, ...AnyHandler[]] = handlers
      ? [...handlers, ...e2eBaselineScenario.handlers]
      : e2eBaselineScenario.handlers;

    public override async seed(em: EntityManager) {
      await e2eBaselineScenario.seed(em);
      await seed?.(em);
    }
  }

  return new E2eScenario();
};
