import { isAPIError } from "better-auth/api";

import { getAuthProviders } from "../../../../auth/get-auth-providers.ts";
import { logger } from "../../../../utilities/logger/logger.ts";
import { User } from "../../../entities/user.entity.ts";

import type { EntityManager } from "@mikro-orm/core";

export interface RegisterUserInput {
  username: string;
  email: string;
  password: string;
  image?: string;
}

export async function registerUser(
  em: EntityManager,
  { username, email, password, image }: RegisterUserInput,
) {
  const { auth } = await import("../../../../auth/auth.ts");
  const authProviders = getAuthProviders();
  const isFirstUser = (await em.count(User)) === 0;

  // Allow registration if signup is enabled OR if this is the first user (admin setup)
  const isSignupEnabled =
    (authProviders["credential"]?.enabled &&
      !authProviders["credential"].disableSignup) ??
    isFirstUser;

  if (!isSignupEnabled) {
    throw new Error("Registration is disabled");
  }

  try {
    if (isFirstUser) {
      logger.info(
        "No users exist, assigning admin role to the first registered user.",
      );

      const { user } = await auth.api.createUser({
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

      logger.info("First user (admin) created:", user);

      await auth.api.signInUsername({
        body: {
          username,
          password,
          callbackURL: "/",
        },
      });

      return await em.findOneOrFail(User, { email: user.email });
    } else {
      const { user } = await auth.api.signUpEmail({
        body: {
          name: username,
          email,
          password,
          image,
          username,
        },
      });

      return await em.findOneOrFail(User, { email: user.email });
    }
  } catch (error) {
    if (isAPIError(error)) {
      throw error;
    }

    logger.error("Error during sign up", { err: error });

    throw new Error("An unexpected error occurred during registration");
  }
}
