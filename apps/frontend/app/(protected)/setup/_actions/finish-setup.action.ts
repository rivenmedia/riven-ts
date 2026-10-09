"use server";

import { redirect } from "next/navigation";

import { SetupForm } from "#app/(protected)/setup/_form-schemas/setup.schema.ts";
import { loggedInActionClient } from "#lib/server-actions/action-client.ts";

export const finishSetup = loggedInActionClient
  .inputSchema(SetupForm)
  .action(() => {
    redirect("/");
  });
