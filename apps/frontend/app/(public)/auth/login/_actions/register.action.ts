"use server";

import { auth, getAuthProviders } from "@/lib/auth";
import { actionClient } from "@/lib/safe-action";

import { APIError } from "better-auth";
import { redirect } from "next/navigation";

import { registerSchema } from "../_form-schemas/register.schema";
import { loginLogger } from "../_utils/logger";
import { noUserExists } from "../_utils/no-user-exists";

export const registerUser = actionClient
  .inputSchema(registerSchema)
  .action(async ({ parsedInput: { password, email, username, image } }) => {
    const authProviders = getAuthProviders();
    const isFirstUser = await noUserExists();

    // Allow registration if signup is enabled OR if this is the first user (admin setup)
    const isSignupEnabled =
      (authProviders["credential"]?.enabled &&
        !authProviders["credential"]?.disableSignup) ||
      isFirstUser;

    if (!isSignupEnabled) {
      throw new Error("Registration is disabled");
    }

    try {
      if (isFirstUser) {
        loginLogger.info(
          "No users exist, assigning admin role to the first registered user.",
        );

        const data = await auth.api.createUser({
          body: {
            name: username,
            email,
            password,
            role: "admin",
            data: {
              username,
              image,
            },
          },
        });

        loginLogger.info("First user (admin) created:", data);

        await auth.api.signInUsername({
          body: {
            username,
            password,
            callbackURL: "/",
          },
          // headers: event.request.headers,
        });
      } else {
        await auth.api.signUpEmail({
          body: {
            name: username,
            username,
            email,
            password,
            image,
          },
        });
      }
    } catch (error) {
      if (error instanceof APIError) {
        throw new Error(error.message);
      }

      loginLogger.error("Error during sign up:", error);

      throw new Error("An unexpected error occurred during registration");
    }

    redirect("/");
  });
