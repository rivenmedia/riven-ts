import z, { type ZodType } from "zod";

export const createPluginResponseSchema = <
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  Payload extends Record<string, ZodType> = {},
>(
  payloadSchema: z.ZodObject<Payload> = z.object<Payload>(),
) =>
  z.object({
    ...payloadSchema.shape,
    plugin: z.string(),
  });
