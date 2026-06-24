import { z } from "zod";

export const privateEnvironment = z
  .object({
    AUTH_SECRET: z.string().min(1),
    DATABASE_URL: z.string().min(1).prefault("./db.sqlite"),
    ORIGIN: z.url(),
  })
  .parse(process.env);
