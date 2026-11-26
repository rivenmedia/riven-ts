import { expect, it } from "vitest";
import { createLogger } from "winston";

import { LoggerSchema } from "./logger.schema.ts";

it("accepts a logger", () => {
  expect(LoggerSchema.safeParse(createLogger()).success).toBe(true);
});

it.for([
  { label: "null", value: null },
  { label: "a string", value: "logger" },
  { label: "an object without logging methods", value: { log: () => true } },
  { label: "an object without an error method", value: { info: () => true } },
])("rejects $label", ({ value }) => {
  expect(LoggerSchema.safeParse(value).success).toBe(false);
});
