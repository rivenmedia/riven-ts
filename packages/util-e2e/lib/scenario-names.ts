export const mockScenarioNames = [
  "dead-stream-link",
  "e2e-baseline",
  "e2e-library",
] as const;

export type MockScenarioName = (typeof mockScenarioNames)[number];
