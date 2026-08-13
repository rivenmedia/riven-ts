import { expect, it, vi } from "vitest";
import { createActor, toPromise } from "xstate";

import { stopGqlServer } from "./stop-gql-server.actor.ts";

import type { ApolloServer } from "@apollo/server";
import type { INestApplicationContext } from "@nestjs/common";

it("stops the server if provided", async () => {
  const stopSpy = vi.fn<ApolloServer["stop"]>();

  const actor = createActor(stopGqlServer, {
    input: {
      applicationContext: undefined,
      server: { stop: stopSpy } as never,
    },
  });

  await toPromise(actor.start());

  expect(stopSpy).toHaveBeenCalledOnce();
});

it("closes the application context if provided", async () => {
  const closeSpy = vi.fn<INestApplicationContext["close"]>();

  const actor = createActor(stopGqlServer, {
    input: {
      applicationContext: { close: closeSpy } as never,
      server: undefined,
    },
  });

  await toPromise(actor.start());

  expect(closeSpy).toHaveBeenCalledOnce();
});
