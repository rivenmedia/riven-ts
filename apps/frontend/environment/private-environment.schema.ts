import { z } from "zod";

export const PrivateEnvironment = z.object({
  AUTH_SECRET: z.string().min(1),
  DATABASE_FILE_NAME: z.string().min(1).prefault("./db.sqlite"),
  DATABASE_LOGGING: z.stringbool().default(false),
  ORIGIN: z.url().prefault("http://localhost:9000"),
  PASSKEY_RP_ID: z.string().min(1).prefault("riven"),
  PASSKEY_RP_NAME: z.string().min(1).prefault("Riven Media"),
  DISABLE_PLEX: z.stringbool().default(false),
  PLEX_CLIENT_ID: z.string().min(1).prefault("riven"),
  ENABLE_PLEX_SIGNUP: z.stringbool().default(true),
});

export const privateEnvironment = PrivateEnvironment.parse(process.env);
