import { type Type, type } from "arktype";

import type { Spread } from "type-fest";

export const createInternalEventSchema = <
  const T extends string,
  I extends Type,
>(
  eventName: T,
  payloadSchema?: I,
): Type<
  Spread<
    { type: `riven-internal.${T}` },
    I["inferOut"] extends object ? I["inferOut"] : object
  >
> =>
  type.raw({
    ...payloadSchema,
    type: `riven-internal.${eventName}` as const,
  }) as never;
