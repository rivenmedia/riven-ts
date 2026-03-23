import z, { ZodError } from "zod";

export const ErrorSplat = z
  .union([
    z.object({
      err: z.instanceof(ZodError),
    }),
    z.instanceof(ZodError),
  ])
  .transform((err) => (err instanceof Error ? err : err.err));

export type ErrorSplat = z.infer<typeof ErrorSplat>;
