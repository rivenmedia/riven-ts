import z from "zod";

export const Chunk = z
  .object({
    fileId: z.number().nonnegative(),
    start: z.number().nonnegative(),
    end: z.number().nonnegative(),
  })
  .transform(({ fileId, start, end }) => ({
    cacheKey:
      `${fileId.toString()}-${start.toString()}-${end.toString()}` as const,
    range: [start, end] as const,
    size: end - start + 1,
  }));

export type Chunk = z.infer<typeof Chunk>;
