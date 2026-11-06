"use server";

import { redirect } from "next/navigation";
import z from "zod";

import { loginSchema } from "#app/(public)/login/_form-schemas/login.schema.ts";
import { loginLogger } from "#app/(public)/login/_utils/logger.ts";
import { authClient } from "#lib/auth/client.ts";
import { actionClient } from "#lib/server-actions/action-client.ts";

export const loginUser = actionClient
  .inputSchema(loginSchema)
  .bindArgsSchemas([z.object({ isCredentialLoginEnabled: z.boolean() })])
  .action(
    async ({
      parsedInput: { username, password },
      bindArgsParsedInputs: [{ isCredentialLoginEnabled }],
    }) => {
      if (!isCredentialLoginEnabled) {
        throw new Error("Email/password login is disabled");
      }

      try {
        await authClient.signIn.username(
          {
            username,
            password,
          },
          { throw: true },
        );
      } catch (error) {
        loginLogger.error("Error during login:", error);

        throw error;
      }

      redirect("/");
    },
  );
