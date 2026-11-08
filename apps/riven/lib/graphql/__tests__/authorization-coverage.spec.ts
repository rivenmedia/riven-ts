import { buildSchema } from "@repo/core-util-graphql-schema";

import { readFileSync } from "node:fs";
import { expect, vi } from "vitest";

import { it } from "#__tests__/test-context.ts";
import { initAuth } from "#auth/auth.ts";
import { authChecker } from "#graphql/auth/auth-checker.ts";
import { pubSub } from "#graphql/pubsub.ts";
import { resolvers } from "#graphql/resolvers/index.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { GraphQLField, GraphQLResolveInfo } from "graphql";

const publicRootFields = new Set(["authProviders"]);

async function importPluginResolvers() {
  const { dependencies, devDependencies } = JSON.parse(
    readFileSync(new URL("../../../package.json", import.meta.url), "utf8"),
  ) as Record<"dependencies" | "devDependencies", Record<string, string>>;

  const pluginPackages = Object.keys({
    ...dependencies,
    ...devDependencies,
  }).filter((name) => name.startsWith("@repo/plugin-"));

  const modules = await Promise.all(
    pluginPackages.map(async (name) =>
      vi.importActual<{ plugin: RivenPlugin }>(name),
    ),
  );

  return modules.flatMap(({ plugin }) => plugin.resolvers);
}

async function runAnonymously(
  { resolve, subscribe }: GraphQLField<unknown, unknown>,
  context: unknown,
) {
  try {
    await (subscribe ?? resolve)?.(
      undefined,
      {},
      context,
      {} as GraphQLResolveInfo,
    );

    return "resolved";
  } catch (error) {
    const { extensions } = error as { extensions?: { code?: unknown } };

    return extensions?.code ?? String(error);
  }
}

it("denies every root field except the public ones to an anonymous caller", async ({
  orm,
  createGqlContext,
}) => {
  initAuth(orm);

  const schema = await buildSchema({
    resolvers: [...resolvers, ...(await importPluginResolvers())],
    pubSub,
    authChecker,
  });

  const rootFields = [
    schema.getQueryType(),
    schema.getMutationType(),
    schema.getSubscriptionType(),
  ].flatMap((type) => Object.values(type?.getFields() ?? {}));

  const context = createGqlContext({ kind: "anonymous" });

  const outcomes = Object.fromEntries(
    await Promise.all(
      rootFields.map(
        async (field) =>
          [field.name, await runAnonymously(field, context)] as const,
      ),
    ),
  );

  expect(Object.keys(outcomes)).toContain("seerrHandleWebhook");
  expect(outcomes).toStrictEqual(
    Object.fromEntries(
      rootFields.map(({ name }) => [
        name,
        publicRootFields.has(name) ? "resolved" : "UNAUTHENTICATED",
      ]),
    ),
  );
});
