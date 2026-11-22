export const mockScenarioNames = ["dead-stream-link", "e2e-baseline"] as const;

export type MockScenarioName = (typeof mockScenarioNames)[number];
