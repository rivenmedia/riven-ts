import assert from "node:assert";

import type { ParamsFor } from "../../types/events.ts";
import type { RivenEvent } from "../events/index.ts";
import type z from "zod";
import type { ZodLiteral, ZodObject, ZodUnknown } from "zod";

type BaseErrorSchema = ZodObject<{
  type: ZodLiteral<RivenEvent["type"]>;
  error?: ZodUnknown;
}>;

function buildErrorMessage(type: string, error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return `Error of type ${type}`;
}

export class ProgramEventError<
  Schema extends BaseErrorSchema,
  Data extends ParamsFor<z.infer<Schema>>,
> extends Error {
  public override name = "ProgramEventError";

  public payload: {
    type: z.infer<Schema>["type"];
  } & Data;

  public constructor(type: z.infer<Schema>["type"], data: Data) {
    super(buildErrorMessage(type, data.error));

    this.payload = { type, ...data };
  }
}

export const createProgramEventError = <
  Schema extends BaseErrorSchema,
  Data extends ParamsFor<z.infer<Schema>>,
>(
  payloadSchema: Schema,
) =>
  class extends ProgramEventError<Schema, Data> {
    public constructor(data: Data) {
      const [type] = payloadSchema.shape.type.def.values;

      assert.ok(type, "Invalid event type");

      super(type, data);
    }
  };
