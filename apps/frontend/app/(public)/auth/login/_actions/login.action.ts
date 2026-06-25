"use server";

import { actionClient } from "@/lib/safe-action";

import { registerSchema } from "$lib/schemas/auth";
import { auth } from "$lib/server/auth";
import { noUserExists } from "$lib/server/first-launch";
import { fail, setError, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";

import { isSignupEnabled } from "../+page.server";
import { loginSchema } from "../_form-schemas/login.schema";

export const loginUser = actionClient
  .inputSchema(loginSchema)
  .action(async ({ parsedInput: { username, password } }) => {
    if (!isCredentialEnabled) {
      return fail(403, { message: "Email/password login is disabled" });
    }

    const loginForm = await superValidate(event.request, zod4(loginSchema));
    if (!loginForm.valid) return fail(400, { loginForm });

    try {
      await auth.api.signInUsername({
        body: {
          username: loginForm.data.username,
          password: loginForm.data.password,
          callbackURL: "/",
        },
        headers: event.request.headers,
      });
    } catch (error) {
      if (error instanceof APIError) {
        return message(loginForm, error.message, {
          status: 400,
        });
      }
      logger.error("Error during login:", error);
      return message(loginForm, "An unexpected error occurred", {
        status: 500,
      });
    }

    return redirect(303, "/");
  });
