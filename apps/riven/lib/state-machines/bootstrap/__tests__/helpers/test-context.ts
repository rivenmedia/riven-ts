/* eslint-disable @typescript-eslint/require-await */
import { it as baseIt } from "@repo/core-util-vitest-test-context";

import { type Actor, createActor, createEmptyActor, fromPromise } from "xstate";

import { type BootstrapMachineInput, bootstrapMachine } from "../../index.ts";

import type { initialiseDatabaseConnection } from "../../actors/initialise-database-connection.actor.ts";
import type { startGqlServer } from "../../actors/start-gql-server.actor.ts";

export const it = baseIt.extend<{
  actor: Actor<typeof bootstrapMachine>;
  input: BootstrapMachineInput;
  machine: typeof bootstrapMachine;
  initialiseDatabaseConnectionActorLogic: typeof initialiseDatabaseConnection;
  startGqlServerActorLogic: typeof startGqlServer;
}>({
  initialiseDatabaseConnectionActorLogic: fromPromise(async () => {
    /* empty */
  }),
  async startGqlServerActorLogic({ apolloServerInstance }, use) {
    await use(
      fromPromise(async () => {
        return {
          server: apolloServerInstance,
          url: "http://localhost:4000/graphql",
        };
      }),
    );
  },
  machine: (
    { initialiseDatabaseConnectionActorLogic, startGqlServerActorLogic },
    use,
  ) =>
    use(
      bootstrapMachine.provide({
        actors: {
          initialiseDatabaseConnection: initialiseDatabaseConnectionActorLogic,
          startGqlServer: startGqlServerActorLogic,
        },
      }),
    ),
  input: {
    rootRef: createEmptyActor(),
  },
  actor: async ({ input, machine }, use) => {
    const actor = createActor(machine, { input });

    await use(actor);

    actor.stop();
  },
});
