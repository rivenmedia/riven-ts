import z from "zod";

function generateSecret(length = 32) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

export const RivenFrontendSettings = z.object({
  authSecret: z.string().default(generateSecret),
  origin: z.url().default("http://localhost:9000"),
  passkeyRpId: z.string().optional(),
  passkeyRpName: z.string().optional(),
  plexClientId: z.string().default("riven"),
  disablePlex: z.stringbool().default(false),
  enablePlexSignup: z.stringbool().default(false),
  disableEmailPassword: z.stringbool().default(false),
  enableEmailPasswordSignup: z.stringbool().default(true),
});

export type RivenFrontendSettings = z.infer<typeof RivenFrontendSettings>;
