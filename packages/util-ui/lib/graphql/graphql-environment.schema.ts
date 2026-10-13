import { z } from "zod";

export const graphqlEnvironment = z
  .object({
    BACKEND_URL: z.url().prefault("http://localhost:3000"),
  })
  .parse(process.env);
