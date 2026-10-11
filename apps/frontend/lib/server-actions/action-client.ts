import { createSafeActionClient } from "next-safe-action";

import {
  PermissionMetadata,
  checkPermissionMiddleware,
} from "./middlewares/check-permission.middleware.ts";
import { checkSessionMiddleware } from "./middlewares/check-session.middleware.ts";

export const actionClient = createSafeActionClient();

export const loggedInActionClient = actionClient.use(checkSessionMiddleware);

export const permissionActionClient = createSafeActionClient({
  defineMetadataSchema: () => PermissionMetadata,
}).use(checkPermissionMiddleware);
