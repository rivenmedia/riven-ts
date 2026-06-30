import { createSafeActionClient } from "next-safe-action";

import { betterAuthMiddleware } from "./middlewares/better-auth.middleware";

export const actionClient = createSafeActionClient();

export const authorisedActionClient = actionClient.use(betterAuthMiddleware);
