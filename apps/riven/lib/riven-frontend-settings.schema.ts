import dedent from "dedent";
import z from "zod";

export const RivenFrontendSettings = z.object({
  authSecret: z
    .string()
    .optional()
    .describe(
      dedent`
        The secret used to sign sessions. Generate one with \`openssl rand -base64 32\`.

        **Note**: If not set, a random secret is generated on every start, which signs out all users whenever Riven restarts.
      `,
    ),
  origin: z
    .url()
    .default("http://localhost:9000")
    .describe(
      "The URL the frontend is served from. Must match the frontend's `ORIGIN`.",
    ),
  passkeyRpId: z
    .string()
    .default("localhost")
    .describe(
      "The domain passkeys are tied to - the frontend's hostname, without scheme or port. Must be a domain, not an IP address.",
    ),
  passkeyRpName: z
    .string()
    .optional()
    .describe("The name shown by the browser when creating a passkey."),
  plexClientId: z
    .string()
    .default("riven")
    .describe("The client identifier sent to Plex when signing in with Plex."),
  disablePlex: z
    .stringbool()
    .default(false)
    .describe("If true, signing in with Plex is disabled."),
  enablePlexSignup: z
    .stringbool()
    .default(false)
    .describe(
      "If true, any Plex user can create an account by signing in with Plex.",
    ),
  disableEmailPassword: z
    .stringbool()
    .default(false)
    .describe("If true, signing in with a username and password is disabled."),
  enableEmailPasswordSignup: z
    .stringbool()
    .default(true)
    .describe(
      dedent`
        If true, anyone who can reach the login page can create an account.

        **Note**: Set this to false if the frontend is reachable by anyone you don't trust.
      `,
    ),
});

export type RivenFrontendSettings = z.infer<typeof RivenFrontendSettings>;
