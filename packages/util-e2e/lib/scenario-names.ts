export const mockScenarioNames = [
  "dead-stream-link",
  "e2e-baseline",
  "e2e-library",
  "e2e-settings",
] as const;

export type MockScenarioName = (typeof mockScenarioNames)[number];
