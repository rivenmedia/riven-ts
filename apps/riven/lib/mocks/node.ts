import { setupServer } from "msw/node";
import z from "zod";

import { scenarios } from "./scenarios/index.ts";

const mockScenarioName = z
  .enum(Object.keys(scenarios) as (keyof typeof scenarios)[])
  .safeParse(process.env["MOCK_SCENARIO"]);

if (!mockScenarioName.success) {
  throw new Error(
    `Invalid mock scenario: ${z.prettifyError(mockScenarioName.error)}`,
  );
}

export const mockScenario = scenarios[mockScenarioName.data];

const scenarioHandlers = mockScenario.handlers;

export const server = setupServer(...scenarioHandlers);

server.listen({ onUnhandledRequest: "bypass" });
