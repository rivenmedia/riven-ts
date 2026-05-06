import z, { type ZodType } from "zod";

export const createProgramEventSchema = <
  Type extends string,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  Payload extends Record<string, ZodType> = {},
>(
  type: Type,
  payloadSchema: z.ZodObject<Payload> = z.object<Payload>(),
) =>
  z.object({
    ...payloadSchema.shape,
    type: z.literal(`riven.${type}`),
  });
