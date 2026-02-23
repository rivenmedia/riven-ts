import type { RivenEvent } from "../events/index.ts";
import type { ZodLiteral, ZodObject } from "zod";

export const getEventTypeFromSchema = <Type extends RivenEvent["type"]>(
  schema: ZodObject<{ type: ZodLiteral<Type> }>,
): Type => {
  const [value] = [...schema.shape.type.values];

  if (!value) {
    throw new Error(
      `Unable to extract event type from schema: no literal value found in "type" property`,
    );
  }

  return value;
};
