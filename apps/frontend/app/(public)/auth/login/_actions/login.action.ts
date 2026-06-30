"use server";

import { authClient } from "@/lib/auth-client";
import { actionClient } from "@/lib/safe-action";

import { isAPIError } from "better-auth/api";
import { redirect } from "next/navigation";
import z from "zod";

import { loginSchema } from "../_form-schemas/login.schema";
import { loginLogger } from "../_utils/logger";

export const loginUser = actionClient
  .inputSchema(loginSchema)
  .bindArgsSchemas([
    z.object({
      isCredentialEnabled: z.boolean(),
    }),
  ])
  .action(
    async ({
      parsedInput: { username, password },
      bindArgsParsedInputs: [{ isCredentialEnabled }],
    }) => {
      if (!isCredentialEnabled) {
        throw new Error("Email/password login is disabled");
      }

      try {
        const { data } = await authClient.signIn.username({
          username: username,
          password: password,
        });

        console.log(data);
      } catch (error) {
        if (isAPIError(error)) {
          throw error;
        }

        loginLogger.error("Error during login:", error);

        throw new Error("An unexpected error occurred during login", {
          cause: error,
        });
      }

      return redirect("/");
    },
  );
