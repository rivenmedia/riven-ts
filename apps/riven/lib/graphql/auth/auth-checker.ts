import { roleHasPermissions } from "@repo/util-auth/access-control";

import { AuthenticationError } from "type-graphql";

import { CoreKey } from "#graphql/context.ts";

import type { ApolloServerContext } from "#graphql/context.ts";
import type { Principal } from "./principal.ts";
import type { Permissions } from "@repo/util-auth/access-control";
import type { AuthChecker } from "type-graphql";

/**
 * Whether `principal` may resolve a field that requires every statement in `required`.
 *
 * An empty list only requires a signed-in caller.
 */
export function isAuthorized(principal: Principal, required: Permissions[]) {
  switch (principal.kind) {
    case "anonymous": {
      return false;
    }
    case "service": {
      return true;
    }
    case "user": {
      return required.every((permissions) =>
        roleHasPermissions(principal.role, permissions),
      );
    }
  }
}

export const authChecker: AuthChecker<ApolloServerContext, Permissions> = (
  { context },
  required,
) => {
  const { principal } = context[CoreKey];

  // TypeGraphQL reports a denied field with permissions as UNAUTHORIZED,
  // but an anonymous caller needs to sign in rather than ask for access.
  if (principal.kind === "anonymous") {
    throw new AuthenticationError();
  }

  return isAuthorized(principal, required);
};
