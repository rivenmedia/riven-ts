"use server";

import { authClient } from "#lib/auth/client.ts";
import { loggedInActionClient } from "#lib/server-actions/action-client.ts";

import { UpdateProfileFormSchema } from "./update-profile.form-schema";

export const updateProfile = loggedInActionClient
  .inputSchema(UpdateProfileFormSchema)
  .action(async ({ parsedInput: { avatar, name, username } }) => {
    await authClient.updateUser({
      name,
      username,
      image: avatar,
      fetchOptions: {
        throw: true,
      },
    });
  });
