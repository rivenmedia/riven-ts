import { expect, it } from "vitest";

import { scenarios } from "./index.ts";

const e2eScenarios = Object.entries(scenarios).filter(([name]) =>
  name.startsWith("e2e-"),
);

it("has E2E scenarios to check", () => {
  expect(e2eScenarios.length).toBeGreaterThan(0);
});

// Every E2E Riven boots with the same environment, so a scenario can't set one
it.for(e2eScenarios)("%s has no environment data", ([, scenario]) => {
  expect(scenario.environmentData).toBeUndefined();
});
