import z from "zod";

import type { ZodObject } from "zod";

export function createPagedResponseSchema<T extends ZodObject>(itemSchema: T) {
  return z.object({
    page: z.int(),
    results: z.array(itemSchema),
    total_pages: z.int(),
    total_results: z.int(),
  });
}
