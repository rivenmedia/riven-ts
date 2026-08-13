import { expect, it, vi } from "vitest";
import { createActor, toPromise } from "xstate";

import { stopGqlServer } from "./stop-gql-server.actor.ts";

import type { ApolloServer } from "@apollo/server";

it("stops the server if provided", async () => {
  const stopSpy = vi.fn<ApolloServer["stop"]>();

  const actor = createActor(stopGqlServer, {
    input: { stop: stopSpy } as never,
  });

  await toPromise(actor.start());

  expect(stopSpy).toHaveBeenCalledOnce();
});

it("does nothing if no server is running", async () => {
  const actor = createActor(stopGqlServer, { input: undefined });

  await expect(toPromise(actor.start())).resolves.toBeUndefined();
});
