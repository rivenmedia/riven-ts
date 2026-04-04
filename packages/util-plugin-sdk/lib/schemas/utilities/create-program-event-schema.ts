import { type Type, type } from "arktype";

import type { Spread } from "type-fest";

export const createProgramEventSchema = <
  const T extends string,
  I extends Type,
>(
  eventName: T,
  payloadSchema?: I,
): Type<
  Spread<
    { type: `riven.${T}` },
    I["inferOut"] extends object ? I["inferOut"] : object
  >
> =>
  type.raw({
    ...payloadSchema,
    type: `riven.${eventName}` as const,
  }) as never;
