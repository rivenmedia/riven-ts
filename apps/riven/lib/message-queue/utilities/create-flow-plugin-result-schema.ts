import z from "zod";

import type { ZodType } from "zod";

export const createPluginResultSchema = <T extends ZodType>(resultSchema: T) =>
  z.object({
    result: resultSchema,
    plugin: z.string(),
  });
