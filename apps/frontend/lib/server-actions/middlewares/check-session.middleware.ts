import { authClient } from "@/lib/auth/client";

import { createMiddleware } from "next-safe-action";
import { unauthorized } from "next/navigation";

export const checkSessionMiddleware = createMiddleware().define(
  async ({ next }) => {
    const { data: authData } = await authClient.getSession({});

    if (!authData) {
      return unauthorized();
    }

    return next({
      ctx: {
        auth: authData,
      },
    });
  },
);
