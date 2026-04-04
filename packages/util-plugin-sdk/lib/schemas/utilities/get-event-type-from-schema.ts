import type { RivenEvent } from "../events/index.ts";
import type { Type } from "arktype";

export const getEventTypeFromSchema = (
  schema: Type<{ type: RivenEvent["type"] }>,
) => schema.get("type");
