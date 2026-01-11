import { expect, it } from "vitest";
import z from "zod";

import { atLeastOnePropertyRequired } from "./at-least-one-property-required.ts";

it("throws an error if all properties are nullish", () => {
  const schema = z
    .object({
      propA: z.string().optional(),
      propB: z.number().nullish(),
      propC: z.boolean().optional(),
    })
    .refine(atLeastOnePropertyRequired, "At least one property is required");

  const { success, error } = schema.safeParse({
    propA: "",
    propB: null,
  });

  expect(success).toBe(false);
  expect(error).toEqual(
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
  const schema = z
    .object({
      propA: z.string().optional(),
      propB: z.number().nullish(),
      propC: z.boolean().optional(),
    })
    .refine(atLeastOnePropertyRequired, "At least one property is required");

  const { success, error } = schema.safeParse({
    propA: "value",
    propB: null,
    propC: undefined,
  });

  expect(success).toBe(true);
  expect(error).toBeUndefined();
});

it("allows falsy values that are not nullish", () => {
  const schema = z
    .object({
      propA: z.string().optional(),
      propB: z.number().nullish(),
      propC: z.boolean().optional(),
      propD: z.array(z.string()).optional(),
    })
    .refine(atLeastOnePropertyRequired, "At least one property is required");

  const { success, error } = schema.safeParse({
    propA: "",
    propB: 0,
    propC: false,
    propD: [],
  });

  expect(success).toBe(true);
  expect(error).toBeUndefined();
});
