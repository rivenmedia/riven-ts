import { getSessionHandler } from "./handlers/get-session.handler";
import { hasPermissionHandler } from "./handlers/has-permission.handler";

import type { AnyHandler } from "msw";

export const handlers = [
  getSessionHandler,
  hasPermissionHandler,
] as const satisfies AnyHandler[];
