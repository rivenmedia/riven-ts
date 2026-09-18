import { createSafeActionClient } from "next-safe-action";

import {
  PermissionMetadata,
  checkPermissionMiddleware,
} from "./middlewares/check-permission.middleware";
import { checkSessionMiddleware } from "./middlewares/check-session.middleware";

export const actionClient = createSafeActionClient();

export const loggedInActionClient = actionClient.use(checkSessionMiddleware);

export const permissionActionClient = createSafeActionClient({
  defineMetadataSchema: () => PermissionMetadata,
}).use(checkPermissionMiddleware);
