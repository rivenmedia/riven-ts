"use server";

import { authorisedActionClient } from "@/lib/server-actions/action-client";

import { redirect } from "next/navigation";

import { SetupForm } from "../_form-schemas/setup.schema";

export const finishSetup = authorisedActionClient
  .inputSchema(SetupForm)
  .action(async ({ parsedInput }) => {
    console.log({ parsedInput });

    redirect("/");
  });
