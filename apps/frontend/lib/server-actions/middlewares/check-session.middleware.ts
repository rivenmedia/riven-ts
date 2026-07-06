import { authClient } from "@/lib/auth/client";

import { createMiddleware } from "next-safe-action";

export const checkSessionMiddleware = createMiddleware().define(
  async ({ next }) => {
    const { data: authData } = await authClient.getSession({});

    if (!authData) {
      throw new Error("User is not authenticated");
    }

    return next({
      ctx: {
        auth: authData,
      },
    });
  },
);
