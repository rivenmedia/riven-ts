"use server";

import { authClient } from "@/lib/auth/client";
import { actionClient } from "@/lib/server-actions/action-client";

import { redirect } from "next/navigation";
import z from "zod";

import { loginSchema } from "../_form-schemas/login.schema";
import { loginLogger } from "../_utils/logger";

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
