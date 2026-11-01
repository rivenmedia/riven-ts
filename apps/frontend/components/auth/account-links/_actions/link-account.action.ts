"use server";

import { z } from "zod";

import { authClient } from "#lib/auth/client.ts";
import { loggedInActionClient } from "#lib/server-actions/action-client.ts";

export const linkAccount = loggedInActionClient
  .inputSchema(
    z.object({
      providerId: z.string(),
    }),
  )
  .action(async ({ parsedInput: { providerId } }) => {
    await authClient.linkSocial({
      provider: providerId,
      callbackURL: "/auth",
      fetchOptions: {
        throw: true,
      },
    });
  });
