import { z } from "zod";

export const publicEnvironment = z
  .object({
    NEXT_PUBLIC_LOG_LEVEL: z.int().default(3),
    NEXT_PUBLIC_LOG_DATE: z.stringbool().default(true),
    NEXT_PUBLIC_LOG_COLORS: z.stringbool().default(true),
    NEXT_PUBLIC_LOG_COMPACT: z.stringbool().default(false),
  })
  .parse(process.env);
