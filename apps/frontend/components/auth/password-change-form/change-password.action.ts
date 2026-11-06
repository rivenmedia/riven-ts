"use server";

import { authClient } from "#lib/auth/client.ts";
import { loggedInActionClient } from "#lib/server-actions/action-client.ts";

import { PasswordChangeFormSchema } from "./password-change.form-schema";

export const changePassword = loggedInActionClient
  .inputSchema(PasswordChangeFormSchema)
  .action(
    async ({
      parsedInput: { currentPassword, newPassword, revokeOtherSessions },
    }) => {
      await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions,
        fetchOptions: {
          throw: true,
        },
      });
    },
  );
