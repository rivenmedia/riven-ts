import { roleHasPermissions } from "@repo/util-auth/access-control";

import { AuthenticationError } from "type-graphql";

import { CoreKey } from "#graphql/context.ts";

import type { ApolloServerContext } from "#graphql/context.ts";
import type { Permissions } from "@repo/util-auth/access-control";
import type { AuthCheckerFn } from "type-graphql";

export const authChecker: AuthCheckerFn<ApolloServerContext, Permissions> = (
  { context },
  required,
) => {
  const { principal } = context[CoreKey];

  switch (principal.kind) {
    case "anonymous": {
      // TypeGraphQL reports a denied field with permissions as UNAUTHORIZED,
      // but an anonymous caller needs to sign in rather than ask for access.
      throw new AuthenticationError();
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
};
