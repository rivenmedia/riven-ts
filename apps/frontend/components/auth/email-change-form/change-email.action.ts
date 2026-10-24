"use server";

import { authClient } from "#lib/auth/client.ts";
import { loggedInActionClient } from "#lib/server-actions/action-client.ts";

import { EmailChangeFormSchema } from "./email-change.form-schema";

export const changeEmail = loggedInActionClient
  .inputSchema(EmailChangeFormSchema)
  .action(async ({ parsedInput: { newEmail } }) => {
    await authClient.changeEmail({
      newEmail,
      fetchOptions: {
        throw: true,
      },
    });
  });
