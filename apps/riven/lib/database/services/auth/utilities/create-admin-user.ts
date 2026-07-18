import { isAPIError } from "better-auth/api";

import { logger } from "../../../../utilities/logger/logger.ts";

export interface CreateAdminUserInput {
  username: string;
  password: string;
}

export async function createAdminUser({
  username,
  password,
}: CreateAdminUserInput) {
  const { auth } = await import("../../../../auth/auth.ts");

  try {
    const { user } = await auth.api.createUser({
      body: {
        name: username,
        email: "admin@email.com",
        password,
        role: "admin",
        data: {
          username,
        },
      },
    });

    logger.info(`Admin user created: ${JSON.stringify(user)}`);

    await auth.api.signInUsername({
      body: {
        username,
        password,
        callbackURL: "/",
      },
    });
  } catch (error) {
    if (isAPIError(error)) {
      throw error;
    }

    logger.error("Error during login:", { err: error });

    throw new Error("An unexpected error occurred during login");
  }
}
