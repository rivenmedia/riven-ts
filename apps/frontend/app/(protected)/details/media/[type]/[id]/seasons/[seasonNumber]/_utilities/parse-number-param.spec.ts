import { expect, it } from "vitest";

import { parseNumberParam } from "./parse-number-param.ts";

it.for([
  ["0", 0],
  ["7", 7],
  ["12", 12],
] as const)("parses the route param %j as %i", ([param, expected]) => {
  expect(parseNumberParam(param)).toBe(expected);
});

it.for(["-1", "1.5", "one", "Infinity"])(
  "rejects the route param %j",
  (param) => {
    expect(parseNumberParam(param)).toBeNull();
  },
);
