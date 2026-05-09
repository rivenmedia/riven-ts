import { expect, it } from "vitest";
import z from "zod";

import { atLeastOnePropertyRequired } from "./at-least-one-property-required.ts";

it("fails the refinement if all properties are nullish", () => {
  const schema = z
    .object({
      propA: z.string().optional(),
      propB: z.number().nullish(),
      propC: z.boolean().optional(),
    })
    .refine(
      (val) => atLeastOnePropertyRequired(val, ["propA", "propB", "propC"]),
      "At least one property is required",
    );

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

it("does not fail the refinement if at least one property is not nullish", () => {
  const schema = z
    .object({
      propA: z.string().optional(),
      propB: z.number().nullish(),
      propC: z.boolean().optional(),
    })
    .refine(
      (val) => atLeastOnePropertyRequired(val, ["propA", "propB", "propC"]),
      "At least one property is required",
    );

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
    .refine(
      (val) =>
        atLeastOnePropertyRequired(val, ["propA", "propB", "propC", "propD"]),
      "At least one property is required",
    );

  const { success, error } = schema.safeParse({
    propA: "",
    propB: 0,
    propC: false,
    propD: [],
  });

  expect(success).toBe(true);
  expect(error).toBeUndefined();
});

it('only checks specified fields when "fields" parameter is provided', () => {
  const schema = z
    .object({
      propA: z.string().optional(),
      propB: z.number().nullish(),
      propC: z.boolean().optional(),
    })
    .refine(
      (val) => atLeastOnePropertyRequired(val, ["propA", "propB"]),
      "At least one property is required",
    );

  const { success, error } = schema.safeParse({
    propA: "",
    propB: null,
    propC: true,
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

it('checks all properties when "fields" parameter is not provided', () => {
  const schema = z
    .object({
      propA: z.string().optional(),
      propB: z.number().nullish(),
      propC: z.boolean().optional(),
    })
    .refine(
      (val) => atLeastOnePropertyRequired(val),
      "At least one property is required",
    );

  const { success, error } = schema.safeParse({
    propA: "",
    propB: null,
    propC: undefined,
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

it("fails the refinement if an empty object is provided against a record schema", () => {
  const schema = z
    .record(z.string(), z.unknown())
    .refine(
      (val) => atLeastOnePropertyRequired(val),
      "At least one property is required",
    );

  const { success, error } = schema.safeParse({});

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

it("does not fail the refinement if a non-empty object is provided against a record schema", () => {
  const schema = z
    .record(z.string(), z.unknown())
    .refine(
      (val) => atLeastOnePropertyRequired(val),
      "At least one property is required",
    );

  const { success, error } = schema.safeParse({ key: "value" });

  expect(success).toBe(true);
  expect(error).toBeUndefined();
});
