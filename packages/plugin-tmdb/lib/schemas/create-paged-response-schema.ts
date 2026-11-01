import z from "zod";

import type { ZodType } from "zod";

export function createPagedResponseSchema<T extends ZodType>(itemSchema: T) {
  return z.object({
    page: z.int(),
    results: z.array(itemSchema),
    total_pages: z.int(),
    total_results: z.int(),
  });
}
