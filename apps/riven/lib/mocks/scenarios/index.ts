import { deadStreamLinkScenario } from "./dead-stream-link.scenario.ts";
import { e2eBaselineScenario } from "./e2e-baseline.scenario.ts";

import type { MockScenarioName } from "../e2e/scenario-names.ts";
import type { MockScenario } from "../utilities/mock-scenario.ts";

export const scenarios: Record<MockScenarioName, MockScenario> = {
  [deadStreamLinkScenario.scenarioName]: deadStreamLinkScenario,
  [e2eBaselineScenario.scenarioName]: e2eBaselineScenario,
};
