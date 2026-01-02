/* eslint-disable @typescript-eslint/require-await */
import { it as baseIt } from "@repo/core-util-vitest-test-context";

import { ApolloServer } from "@apollo/server";
import { type Actor, createActor, fromPromise } from "xstate";

import type { initialiseDatabaseConnection } from "../../actors/initialise-database-connection.actor.ts";
import type { startGqlServer } from "../../actors/start-gql-server.actor.ts";
import type { stopGqlServer } from "../../actors/stop-gql-server.actor.ts";
import { type BootstrapMachineInput, bootstrapMachine } from "../../index.ts";

export const it = baseIt.extend<{
  actor: Actor<typeof bootstrapMachine>;
  input: BootstrapMachineInput;
  machine: typeof bootstrapMachine;
  initialiseDatabaseConnectionActorLogic: typeof initialiseDatabaseConnection;
  startGqlServerActorLogic: typeof startGqlServer;
  stopGqlServerActorLogic: typeof stopGqlServer;
}>({
  initialiseDatabaseConnectionActorLogic: fromPromise(async () => {
    /* empty */
  }),
  startGqlServerActorLogic: fromPromise(async () => {
    return {
      server: {} as ApolloServer,
      url: "http://localhost:4000/graphql",
    };
  }),
  stopGqlServerActorLogic: fromPromise(async () => undefined),
  machine: (
    {
      initialiseDatabaseConnectionActorLogic,
      startGqlServerActorLogic,
      stopGqlServerActorLogic,
    },
    use,
  ) =>
    use(
      bootstrapMachine.provide({
        actors: {
          initialiseDatabaseConnection: initialiseDatabaseConnectionActorLogic,
          startGqlServer: startGqlServerActorLogic,
          stopGqlServer: stopGqlServerActorLogic,
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
