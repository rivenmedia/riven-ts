import { z } from "zod";

export const privateEnvironment = z
  .object({
    ORIGIN: z.url().prefault("https://localhost:9000"),
    BACKEND_URL: z.url().prefault("http://localhost:3000"),
  })
  .parse(process.env);
