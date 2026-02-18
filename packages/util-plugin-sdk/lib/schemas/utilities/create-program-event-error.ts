import z, { type ZodLiteral, type ZodObject, type ZodUnknown } from "zod";

import type { ParamsFor } from "../../types/events.ts";
import type { RivenEvent } from "../events/index.ts";

type BaseErrorSchema = ZodObject<{
  type: ZodLiteral<RivenEvent["type"]>;
  error?: ZodUnknown;
}>;

export class ProgramEventError<
  Schema extends BaseErrorSchema,
  Data extends ParamsFor<z.infer<Schema>>,
> extends Error {
  payload: {
    type: z.infer<Schema>["type"];
  } & Data;

  constructor(type: z.infer<Schema>["type"], data: Data) {
    super(data.error ? String(data.error) : `Error of type ${type}`);

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
    constructor(data: Data) {
      const [type] = payloadSchema.shape.type.def.values;

      if (!type) {
        throw new Error("Invalid event type");
      }

      super(type, data);
    }
  };
