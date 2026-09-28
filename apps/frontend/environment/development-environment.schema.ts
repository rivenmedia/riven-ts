import { z } from "zod";

export const developmentEnvironment = z
  .object({
    ENABLE_MOCKS: z.stringbool().default(false),
  })
  .parse(process.env);
