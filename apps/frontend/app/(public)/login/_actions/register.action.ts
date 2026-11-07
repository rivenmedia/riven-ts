"use server";

import { redirect } from "next/navigation";
import z from "zod";

import { registerSchema } from "#app/(public)/login/_form-schemas/register.schema.ts";
import { loginLogger } from "#app/(public)/login/_utils/logger.ts";
import { authClient } from "#lib/auth/client.ts";
import { actionClient } from "#lib/server-actions/action-client.ts";

export const registerUser = actionClient
  .inputSchema(registerSchema)
  .bindArgsSchemas([z.object({ isSignupEnabled: z.boolean() })])
  .action(
    async ({
      parsedInput: { password, email, username, image },
      bindArgsParsedInputs: [{ isSignupEnabled }],
    }) => {
      if (!isSignupEnabled) {
        throw new Error("Registration is disabled");
      }

      const { error } = await authClient.signUp.email({
        name: username,
        username,
        email,
        password,
        ...(image && { image }),
      });

      if (error) {
        loginLogger.error("Error during sign up:", error);

        throw new Error(error.message ?? error.statusText, { cause: error });
      }

      redirect("/");
    },
  );
