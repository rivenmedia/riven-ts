import { buildSchema } from "@repo/core-util-graphql-schema";
import { RequirePermissions } from "@repo/util-plugin-sdk";

import { ApolloServer } from "@apollo/server";
import { AuthenticationError, Authorized, Query, Resolver } from "type-graphql";
import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";

import { authChecker } from "./auth-checker.ts";

import type { ApolloServerContext } from "#graphql/context.ts";
import type { Principal } from "./principal.ts";
import type { Permissions } from "@repo/util-auth/access-control";
import type { GraphQLResolveInfo } from "graphql";

const anonymous: Principal = { kind: "anonymous" };
const service: Principal = { kind: "service" };

function signedIn(role: string): Principal {
  return { kind: "user", userId: "user-id", role };
}

function checkField(context: ApolloServerContext, required: Permissions[]) {
  return authChecker(
    { root: {}, args: {}, context, info: {} as GraphQLResolveInfo },
    required,
  );
}

it.for<[Permissions[]]>([[[]], [[{ item: ["request"] }]]])(
  "authChecker rejects an anonymous caller requiring %j as unauthenticated",
  ([required], { createGqlContext }) => {
    expect(() => checkField(createGqlContext(anonymous), required)).toThrow(
      AuthenticationError,
    );
  },
);

it.for<[Principal, Permissions[], boolean]>([
  [service, [], true],
  [service, [{ instance: ["manage-settings"] }, { item: ["delete"] }], true],
  [signedIn("admin"), [], true],
  [
    signedIn("admin"),
    [{ instance: ["manage-settings"] }, { item: ["reset"] }],
    true,
  ],
  [signedIn("manager"), [], true],
  [signedIn("manager"), [{ item: ["reset"] }], true],
  [signedIn("manager"), [{ instance: ["manage-settings"] }], false],
  [
    signedIn("manager"),
    [{ item: ["reset"] }, { instance: ["manage-settings"] }],
    false,
  ],
  [signedIn("user"), [], true],
  [signedIn("user"), [{ item: ["request"] }], true],
  [signedIn("user"), [{ item: ["reset"] }], false],
  [signedIn(""), [], true],
  [signedIn(""), [{ item: ["request"] }], false],
])(
  "authChecker authorizes %j requiring %j: %s",
  ([principal, required, expected], { createGqlContext }) => {
    expect(checkField(createGqlContext(principal), required)).toBe(expected);
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

it.for<[Principal, Record<string, boolean | null>, string[]]>([
  [
    anonymous,
    { signedIn: null, manageSettings: null },
    ["UNAUTHENTICATED", "UNAUTHENTICATED"],
  ],
  [
    signedIn("user"),
    { signedIn: true, manageSettings: null },
    ["UNAUTHORIZED"],
  ],
  [signedIn("admin"), { signedIn: true, manageSettings: true }, []],
  [service, { signedIn: true, manageSettings: true }, []],
])(
  "authChecker resolves %j to %j with errors %j",
  async ([principal, expectedData, expectedCodes], { createGqlContext }) => {
    const server = new ApolloServer<ApolloServerContext>({
      schema: await buildSchema({
        resolvers: [ProbeResolver],
        authChecker,
      }),
    });

    const { body } = await server.executeOperation(
      { query: "{ signedIn manageSettings }" },
      { contextValue: createGqlContext(principal) },
    );

    expect.assert(body.kind === "single");
    expect(structuredClone(body.singleResult.data)).toStrictEqual(expectedData);
    expect(
      body.singleResult.errors?.map(({ extensions }) => extensions?.["code"]) ??
        [],
    ).toStrictEqual(expectedCodes);
  },
);
