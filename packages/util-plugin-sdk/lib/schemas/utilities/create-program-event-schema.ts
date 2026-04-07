import z, { type ZodType } from "zod";

import type { Promisable } from "type-fest";

export const createProgramEventSchema = async <
  Type extends string,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  Payload extends Record<string, ZodType> = {},
>(
  type: Type,
  createPayloadSchema: () => Promisable<z.ZodObject<Payload>> = () =>
    z.object<Payload>(),
) => {
  const payloadSchema = await createPayloadSchema();

  return z.object({
    ...payloadSchema.shape,
    type: z.literal(`riven.${type}`),
  });
};
