/* eslint-disable @typescript-eslint/require-await */
import { it as baseIt } from "@repo/core-util-vitest-test-context";

import { ApolloServer } from "@apollo/server";
import { type Actor, createActor, fromPromise } from "xstate";

import type { initialiseDatabaseConnection } from "../../actors/initialise-database-connection.actor.ts";
import type { startGqlServer } from "../../actors/start-gql-server.actor.ts";
import type { stopGqlServer } from "../../actors/stop-gql-server.actor.ts";
import { type BoostrapMachineInput, bootstrapMachine } from "../../index.ts";

export const it = baseIt.extend<{
  actor: Actor<typeof bootstrapMachine>;
  input: BoostrapMachineInput;
  machine: typeof bootstrapMachine;
  initialiseDatabaseConnectionActor: typeof initialiseDatabaseConnection;
  startGqlServerActor: typeof startGqlServer;
  stopGqlServerActor: typeof stopGqlServer;
}>({
  initialiseDatabaseConnectionActor: fromPromise(async () => {
    /* empty */
  }),
  startGqlServerActor: fromPromise(async () => {
    return {
      server: {} as ApolloServer,
      url: "http://localhost:4000/graphql",
    };
  }),
  stopGqlServerActor: fromPromise(async () => undefined),
  machine: (
    {
      initialiseDatabaseConnectionActor,
      startGqlServerActor,
      stopGqlServerActor,
    },
    use,
  ) =>
    use(
      bootstrapMachine.provide({
        actors: {
          initialiseDatabaseConnection: initialiseDatabaseConnectionActor,
          startGqlServer: startGqlServerActor,
          stopGqlServer: stopGqlServerActor,
        },
      }),
    ),
  input: {
    cache: {} as never,
    sessionId: crypto.randomUUID(),
  },
  actor: async ({ input, machine }, use) => {
    const actor = createActor(machine, { input });

    actor.start();

    await use(actor);

    actor.stop();
  },
});
