import { type } from "arktype";
import { expect, it } from "vitest";

import { recordIsNotEmpty } from "./record-is-not-empty.ts";

it("throws an error if the record is empty", () => {
  const schema = type({
    "propA?": "string",
    "propB?": "number | null",
    "propC?": "boolean",
  }).narrow(recordIsNotEmpty);

  const validationResult = schema({});

  expect(validationResult).toBeInstanceOf(type.errors);
  expect(validationResult).toEqual(
    expect.objectContaining({
      issues: [
        expect.objectContaining({
          message: "Record must not be empty",
        }),
      ],
    }),
  );
});

it("does not throw an error if the record is not empty", () => {
  const schema = type({
    "propA?": "string",
    "propB?": "number | null",
    "propC?": "boolean",
  }).narrow(recordIsNotEmpty);

  const validationResult = schema({
    propA: "value",
  });

  expect(validationResult).toBe(true);
});
