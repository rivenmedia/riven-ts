import { z } from "zod";

export const privateEnvironment = z
  .object({
    BACKEND_URL: z.url().prefault("http://localhost:3000"),
    BACKEND_API_KEY: z.string().min(32).optional(),
  })
  .parse(process.env);
