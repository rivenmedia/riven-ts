"use server";

import { z } from "zod";

import { authClient } from "#lib/auth/client.ts";
import { loggedInActionClient } from "#lib/server-actions/action-client.ts";

export const deleteUser = loggedInActionClient
  .inputSchema(z.string().min(1))
  .action(async ({ parsedInput: userId }) => {
    const { success } = await authClient.admin.removeUser(
      { userId },
      { throw: true },
    );

    if (!success) {
      throw new Error("Failed to delete user.");
    }
  });
