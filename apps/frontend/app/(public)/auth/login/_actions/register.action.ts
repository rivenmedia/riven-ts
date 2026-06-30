"use server";

import { authClient } from "@/lib/auth-client";
import { actionClient } from "@/lib/safe-action";

import { APIError } from "better-auth";
import { redirect } from "next/navigation";
import z from "zod";

import { registerSchema } from "../_form-schemas/register.schema";
import { loginLogger } from "../_utils/logger";

export const registerUser = actionClient
  .inputSchema(registerSchema)
  .bindArgsSchemas([z.object({ isSignupEnabled: z.boolean() })])
  .action(
    async ({
      parsedInput: { password, email, username, image },
      bindArgsParsedInputs: [{ isSignupEnabled }],
      ctx: { origin },
    }) => {
      if (!isSignupEnabled) {
        throw new Error("Registration is disabled");
      }

      try {
        const res = await authClient.signUp.email({
          name: username,
          username,
          email,
          password,
          ...(image && { image }),
          fetchOptions: {
            headers: {
              origin,
            },
          },
        });

        if (res.error) {
          throw new Error(
            res.error.message ??
              "An unknown error occurred during registration",
          );
        }
      } catch (error) {
        if (error instanceof APIError) {
          throw new Error(error.message);
        }

        loginLogger.error("Error during sign up:", error);

        throw new Error("An unexpected error occurred during registration", {
          cause: error,
        });
      }

      return redirect("/");
    },
  );
