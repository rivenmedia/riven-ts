"use server";

import { redirect } from "next/navigation";

import { authClient } from "#lib/auth/client.ts";
import { permissionActionClient } from "#lib/server-actions/action-client.ts";

export const deleteAccount = permissionActionClient
  .metadata({
    permissions: {
      user: ["delete"],
    },
  })
  .action(async () => {
    await authClient.deleteUser({
      fetchOptions: {
        throw: true,
      },
    });

    await authClient.signOut({
      fetchOptions: {
        throw: true,
      },
    });

    redirect("/login");
  });
