import { roleHasPermissions } from "@repo/util-auth/access-control";

import type { Principal } from "./principal.ts";
import type { Permissions } from "@repo/util-auth/access-control";

/**
 * Whether `principal` may perform every action in `permissions`.
 *
 * @param principal The caller
 * @param permissions The actions required, keyed by resource
 */
export function principalHasPermissions(
  principal: Principal,
  permissions: Permissions,
) {
  switch (principal.kind) {
    case "anonymous": {
      return false;
    }
    case "service": {
      return true;
    }
    case "user": {
      return roleHasPermissions(principal.role, permissions);
    }
  }
}
