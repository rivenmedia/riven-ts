import { isAPIError } from "better-auth/api";

import { getAuthProviders } from "../../../../auth/get-auth-providers.ts";
import { logger } from "../../../../utilities/logger/logger.ts";
import { User } from "../../../entities/user.entity.ts";

import type { EntityManager } from "@mikro-orm/core";

export interface LoginUserInput {
  username: string;
  password: string;
}

export async function loginUser(
  em: EntityManager,
  { username, password }: LoginUserInput,
) {
  const { auth } = await import("../../../../auth/auth.ts");
  const authProviders = getAuthProviders();

  const isCredentialEnabled = authProviders["credential"]?.enabled ?? false;

  if (!isCredentialEnabled) {
    throw new Error("Email/password login is disabled");
  }

  try {
    const { user } = await auth.api.signInUsername({
      body: {
        username,
        password,
        callbackURL: "/",
      },
    });

    return await em.findOneOrFail(User, { email: user.email });
  } catch (error) {
    if (isAPIError(error)) {
      throw error;
    }

    logger.error("Error during login:", { err: error });

    throw new Error("An unexpected error occurred during login");
  }
}
