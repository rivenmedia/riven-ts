"use server";

import { authClient } from "#lib/auth/client.ts";
import { loggedInActionClient } from "#lib/server-actions/action-client.ts";

import { ChangeEmailFormSchema } from "./change-email.form-schema";

export const changeEmail = loggedInActionClient
  .inputSchema(ChangeEmailFormSchema)
  .action(async ({ parsedInput: { newEmail } }) => {
    await authClient.changeEmail({
      newEmail,
      fetchOptions: {
        throw: true,
      },
    });
  });
