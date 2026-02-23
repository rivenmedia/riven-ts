import z, { type ZodType } from "zod";

export const createPluginResultSchema = <T extends ZodType>(resultSchema: T) =>
  z.object({
    result: resultSchema,
    plugin: z.string(),
  });
