import { ApolloServer } from "@apollo/server";
import { expect } from "vitest";
import { toPromise } from "xstate";

import { it } from "./helpers/test-context.ts";

it("returns the validated plugins", async ({ actor }) => {
  const output = await toPromise(actor.start());

  expect(output.plugins.get(Symbol.for("@repo/plugin-test"))).toBeDefined();
});

it("returns the GraphQL server instance", async ({ actor }) => {
  const output = await toPromise(actor.start());

  expect(output.server).toBeInstanceOf(ApolloServer);
});
