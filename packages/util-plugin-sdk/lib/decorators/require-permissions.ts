import { Authorized } from "type-graphql";

import type { Permissions } from "@repo/util-auth/access-control";

/**
 * Restricts a resolver, query, mutation, subscription or field to callers
 * whose role grants every action in `permissions`.
 *
 * @param permissions The actions required, keyed by resource
 */
export function RequirePermissions(
  permissions: Permissions,
  // The inferred type references a type-graphql type that declarations can't name
): ReturnType<typeof Authorized> {
  return Authorized<Permissions>([permissions]);
}
