"use server";

import { authClient } from "@/lib/auth/client";
import { actionClient } from "@/lib/server-actions/action-client";

import { redirect } from "next/navigation";
import z from "zod";

import { loginSchema } from "../_form-schemas/login.schema";
import { loginLogger } from "../_utils/logger";

export const loginUser = actionClient
  .inputSchema(loginSchema)
  .bindArgsSchemas([z.object({ isCredentialProviderEnabled: z.boolean() })])
  .action(
    async ({
      parsedInput: { username, password },
      bindArgsParsedInputs: [{ isCredentialProviderEnabled }],
    }) => {
      if (!isCredentialProviderEnabled) {
        throw new Error("Email/password login is disabled");
      }

      const { error } = await authClient.signIn.username({
        username: username,
        password: password,
      });

      if (error) {
        loginLogger.error("Error during login:", error);

        throw new Error(error.message ?? error.statusText, { cause: error });
      }

      return redirect("/");
    },
  );
