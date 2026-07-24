import { expect, it, vi } from "vitest";
import { createActor } from "xstate";

import { stopGqlServer } from "./stop-gql-server.actor.ts";

import type { ApolloServer } from "@apollo/server";

it("stops the server if provided", () => {
  const stopSpy = vi.fn<ApolloServer["stop"]>();

  const actor = createActor(stopGqlServer, {
    input: {
      stop: stopSpy,
    } as never,
  });

  actor.start();

  expect(stopSpy).toHaveBeenCalledOnce();
});
