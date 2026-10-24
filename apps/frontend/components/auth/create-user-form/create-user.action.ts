"use server";

import { authClient } from "#lib/auth/client.ts";
import { permissionActionClient } from "#lib/server-actions/action-client.ts";

import { CreateUserFormSchema } from "./create-user.form-schema";

export const createUser = permissionActionClient
  .metadata({
    permissions: {
      user: ["create"],
    },
  })
  .inputSchema(CreateUserFormSchema)
  .action(async ({ parsedInput: { email, password, role, username } }) => {
    await authClient.admin.createUser({
      email,
      password,
      role,
      name: username,
      fetchOptions: {
        throw: true,
      },
    });
  });
