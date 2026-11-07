"use server";

import { redirect } from "next/navigation";

import { authClient } from "#lib/auth/client.ts";
import { loggedInActionClient } from "#lib/server-actions/action-client.ts";

export const logout = loggedInActionClient.action(async () => {
  await authClient.signOut({
    fetchOptions: {
      throw: true,
    },
  });

  redirect("/login");
});
