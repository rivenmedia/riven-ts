import { type } from "arktype";
import { expect, it } from "vitest";

import { atLeastOnePropertyRequired } from "./at-least-one-property-required.ts";

it("throws an error if all properties are nullish", () => {
  const schema = type({
    "propA?": "string",
    "propB?": "number | null",
    "propC?": "boolean",
  }).narrow(atLeastOnePropertyRequired);

  const validationResult = schema({
    propA: "",
    propB: null,
  });

  expect(validationResult).toBeInstanceOf(type.errors);
  expect(validationResult).toEqual(
    expect.objectContaining({
      issues: [
        expect.objectContaining({
          message: "At least one property is required",
        }),
      ],
    }),
  );
});

it("does not throw an error if at least one property is not nullish", () => {
  const schema = type({
    "propA?": "string",
    "propB?": "number | null",
    "propC?": "boolean",
  }).narrow(atLeastOnePropertyRequired);

  const validationResult = schema({
    propA: "value",
    propB: null,
    propC: undefined,
  });

  expect(validationResult).toBe(true);
});

it("allows falsy values that are not nullish", () => {
  const schema = type({
    "propA?": "string",
    "propB?": "number | null",
    "propC?": "boolean",
    "propD?": "string[]",
  }).narrow(atLeastOnePropertyRequired);

  const validationResult = schema({
    propA: "",
    propB: 0,
    propC: false,
    propD: [],
  });

  expect(validationResult).toBe(true);
});
