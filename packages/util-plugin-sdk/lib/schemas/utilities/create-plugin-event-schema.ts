import z, { type ZodType } from "zod";

export const createPluginEventSchema = <
  Type extends string,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  Payload extends Record<string, ZodType> = {},
>(
  type: Type,
  payloadSchema: z.ZodObject<Payload> = z.object<Payload>(),
) =>
  z.object({
    ...payloadSchema.shape,
    plugin: z.symbol(),
    type: z.literal(`riven-plugin.${type}`),
  });
