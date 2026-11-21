import { buildSchema } from "@repo/core-util-graphql-schema";
import { RequirePermissions } from "@repo/util-plugin-sdk";

import { ApolloServer } from "@apollo/server";
import { AuthenticationError, Authorized, Query, Resolver } from "type-graphql";
import { expect } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";

import { authChecker } from "./auth-checker.ts";

import type { ApolloServerContext } from "#graphql/context.ts";
import type { Principal } from "./principal.ts";
import type { Permissions, UserRole } from "@repo/util-auth/access-control";
import type { GraphQLResolveInfo } from "graphql";

/** A caller, described by its kind, or by its role when it's a signed-in user. */
type Caller = "anonymous" | "service" | UserRole;

const it = baseIt.extend(
  "principalFor",
  () =>
    (caller: Caller): Principal =>
      caller === "anonymous" || caller === "service"
        ? { kind: caller }
        : { kind: "user", userId: "user-id", role: caller },
);

function checkField(context: ApolloServerContext, required: Permissions[]) {
  return authChecker(
    { root: {}, args: {}, context, info: {} as GraphQLResolveInfo },
    required,
  );
}

it.for<[Permissions[]]>([[[]], [[{ item: ["request"] }]]])(
  "authChecker rejects an anonymous caller requiring %j as unauthenticated",
  ([required], { createGqlContext, principalFor }) => {
    expect(() =>
      checkField(createGqlContext(principalFor("anonymous")), required),
    ).toThrow(AuthenticationError);
  },
);

it.for<[Caller, Permissions[], boolean]>([
  ["service", [], true],
  ["service", [{ instance: ["manage-settings"] }, { item: ["delete"] }], true],
  ["admin", [], true],
  ["admin", [{ instance: ["manage-settings"] }, { item: ["reset"] }], true],
  ["manager", [], true],
  ["manager", [{ item: ["reset"] }], true],
  ["manager", [{ instance: ["manage-settings"] }], false],
  ["manager", [{ item: ["reset"] }, { instance: ["manage-settings"] }], false],
  ["user", [], true],
  ["user", [{ item: ["request"] }], true],
  ["user", [{ item: ["reset"] }], false],
  ["" as UserRole, [], true],
  ["" as UserRole, [{ item: ["request"] }], false],
])(
  "authChecker authorizes %j requiring %j: %s",
  ([caller, required, expected], { createGqlContext, principalFor }) => {
    expect(checkField(createGqlContext(principalFor(caller)), required)).toBe(
      expected,
    );
  },
);

@Resolver()
class ProbeResolver {
  @Authorized()
  @Query(() => Boolean, { nullable: true })
  public signedIn() {
    return true;
  }

  @RequirePermissions({ instance: ["manage-settings"] })
  @Query(() => Boolean, { nullable: true })
  public manageSettings() {
    return true;
  }
}

it.for<[Caller, Record<string, boolean | null>, string[]]>([
  [
    "anonymous",
    { signedIn: null, manageSettings: null },
    ["UNAUTHENTICATED", "UNAUTHENTICATED"],
  ],
  ["user", { signedIn: true, manageSettings: null }, ["UNAUTHORIZED"]],
  ["admin", { signedIn: true, manageSettings: true }, []],
  ["service", { signedIn: true, manageSettings: true }, []],
])(
  "authChecker resolves %j to %j with errors %j",
  async (
    [caller, expectedData, expectedCodes],
    { createGqlContext, principalFor },
  ) => {
    const server = new ApolloServer<ApolloServerContext>({
      schema: await buildSchema({
        resolvers: [ProbeResolver],
        authChecker,
      }),
    });

    const { body } = await server.executeOperation(
      { query: "{ signedIn manageSettings }" },
      { contextValue: createGqlContext(principalFor(caller)) },
    );

    expect.assert(body.kind === "single");
    expect(structuredClone(body.singleResult.data)).toStrictEqual(expectedData);
    expect(
      body.singleResult.errors?.map(({ extensions }) => extensions?.["code"]) ??
        [],
    ).toStrictEqual(expectedCodes);
  },
);
