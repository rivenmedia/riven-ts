import { expect, it } from "vitest";
import z from "zod";

import { recordIsNotEmpty } from "./record-is-not-empty.ts";

it("throws an error if the record is empty", () => {
  const schema = z
    .object({
      propA: z.string().optional(),
      propB: z.number().nullish(),
      propC: z.boolean().optional(),
    })
    .refine(recordIsNotEmpty, "Record must not be empty");

  const { success, error } = schema.safeParse({});

  expect(success).toBe(false);
  expect(error).toEqual(
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
  const schema = z
    .object({
      propA: z.string().optional(),
      propB: z.number().nullish(),
      propC: z.boolean().optional(),
    })
    .refine(recordIsNotEmpty, "Record must not be empty");

  const { success, error } = schema.safeParse({
    propA: "value",
  });

  expect(success).toBe(true);
  expect(error).toBeUndefined();
});
