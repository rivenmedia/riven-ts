import type { ParamsFor } from "../../types/events.ts";
import type { RivenEvent } from "../events/index.ts";
import type { Type } from "arktype";

type BaseErrorSchema = Type<{
  type: RivenEvent["type"];
  error?: unknown;
}>;

export class ProgramEventError<
  Schema extends BaseErrorSchema,
  Data extends ParamsFor<Schema["infer"]>,
> extends Error {
  payload: {
    type: Schema["infer"]["type"];
  } & Data;

  constructor(type: Schema["infer"]["type"], data: Data) {
    super(data.error ? String(data.error) : `Error of type ${type}`);

    this.payload = { type, ...data };
  }
}

export const createProgramEventError = <
  Schema extends BaseErrorSchema,
  Data extends ParamsFor<Schema["infer"]>,
>(
  payloadSchema: Schema,
) =>
  class extends ProgramEventError<Schema, Data> {
    constructor(data: Data) {
      const type = payloadSchema.get("type");

      super(type, data);
    }
  };
