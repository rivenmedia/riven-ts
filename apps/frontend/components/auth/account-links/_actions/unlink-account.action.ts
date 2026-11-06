"use server";

import { z } from "zod";

import { authClient } from "#lib/auth/client.ts";
import { loggedInActionClient } from "#lib/server-actions/action-client.ts";

export const unlinkAccount = loggedInActionClient
  .inputSchema(
    z.object({
      providerId: z.string(),
    }),
  )
  .action(async ({ parsedInput: { providerId } }) => {
    const accounts = await authClient.listAccounts({
      fetchOptions: { throw: true },
    });

    const accountToUnlink = accounts.find(
      (target) => target.providerId === providerId,
    );

    if (!accountToUnlink) {
      throw new Error("Account not found.");
    }

    await authClient.unlinkAccount({ accountId: accountToUnlink.id });
  });
