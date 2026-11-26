import { json } from "@repo/util-plugin-sdk/validation";

import dedent from "dedent";
import z from "zod";

const ipAddressOrRange = z.union([z.ipv4(), z.ipv6(), z.cidrv4(), z.cidrv6()]);

// Refined from a plain string so the generated docs show `string`: zod2md can't render CIDR formats
const trustedProxy = z
  .string()
  .refine((value) => ipAddressOrRange.safeParse(value).success, {
    error: "Must be an IP address or CIDR range",
  });

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
  trustedProxies: json(z.array(trustedProxy))
    .default([])
    .describe(
      dedent`
        A JSON array of the IP addresses or CIDR ranges of the proxies in front of Riven, such as the frontend and any reverse proxy. Riven uses them to find each client's IP in \`X-Forwarded-For\` for rate limiting.

        **Note**: In Docker, set this to the Docker network's range, e.g. \`["172.16.0.0/12"]\`. Don't include the range your own devices are on, or Riven can't tell them apart.
      `,
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
