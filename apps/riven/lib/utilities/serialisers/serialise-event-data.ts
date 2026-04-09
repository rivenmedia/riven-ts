import assert from "node:assert";

import { eventSerialiserSchemaMap } from "./event-serialiser-schemas.ts";

import type { ParamsFor } from "@repo/util-plugin-sdk";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";

export const serialiseEventData = <T extends RivenEvent["type"]>(
  type: T,
  data: ParamsFor<Extract<RivenEvent, { type: T }>>,
) => {
  const serialiser = eventSerialiserSchemaMap.get(type);

  assert(serialiser, `No serialiser schema found for event type: ${type}`);

  return serialiser.omit({ type: true }).encode(data);
};
