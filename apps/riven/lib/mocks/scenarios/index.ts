import { deadStreamLinkScenario } from "./dead-stream-link.scenario.ts";
import { e2eBaselineScenario } from "./e2e-baseline.scenario.ts";
import { e2eLibraryScenario } from "./e2e-library.scenario.ts";

import type { MockScenario } from "../utilities/mock-scenario.ts";
import type { MockScenarioName } from "@repo/util-e2e";

export const scenarios: Record<MockScenarioName, MockScenario> = {
  [deadStreamLinkScenario.scenarioName]: deadStreamLinkScenario,
  [e2eBaselineScenario.scenarioName]: e2eBaselineScenario,
  [e2eLibraryScenario.scenarioName]: e2eLibraryScenario,
};
