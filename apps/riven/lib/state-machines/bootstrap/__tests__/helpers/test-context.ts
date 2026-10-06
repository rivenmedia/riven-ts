/* eslint-disable @typescript-eslint/require-await */
import Fuse from "@zkochan/fuse-native";
import { createActor, createEmptyActor, fromPromise } from "xstate";

import { it as baseIt } from "#__tests__/test-context.ts";
import { bootstrapMachine } from "#state-machines/bootstrap/index.ts";

import type {
  InitialiseVfsInput,
  InitialiseVfsOutput,
} from "#state-machines/bootstrap/actors/initialise-vfs.actor.ts";
import type {
  StartGQLServerInput,
  StartGQLServerOutput,
} from "#state-machines/bootstrap/actors/start-gql-server.actor.ts";
import type { BootstrapMachineInput } from "#state-machines/bootstrap/index.ts";

export const it = baseIt
  .extend(
    "input",
    (): BootstrapMachineInput => ({
      rootRef: createEmptyActor(),
      mainRunnerRef: createEmptyActor(),
      mockScenario: undefined,
    }),
  )

  .extend(
    "initialiseDatabaseConnectionActorLogic",
    fromPromise(async () => {
      /* empty */
    }),
  )
  .extend("startGqlServerActorLogic", ({ apolloServerInstance }) =>
    fromPromise<StartGQLServerOutput, StartGQLServerInput>(async () => ({
      server: apolloServerInstance,
      url: "http://localhost:3000",
    })),
  )
  .extend(
    "initialiseVfsActorLogic",
    fromPromise<InitialiseVfsOutput, InitialiseVfsInput>(async () => ({
      vfs: new Fuse("/mnt/fake-path", {}),
    })),
  )
  .extend(
    "machine",
    ({
      initialiseDatabaseConnectionActorLogic,
      startGqlServerActorLogic,
      initialiseVfsActorLogic,
    }) =>
      bootstrapMachine.provide({
        actors: {
          initialiseDatabaseConnection: initialiseDatabaseConnectionActorLogic,
          startGqlServer: startGqlServerActorLogic,
          initialiseVfs: initialiseVfsActorLogic,
        },
      }),
  )
  .extend("actor", async ({ input, machine }, { onCleanup }) => {
    const actor = createActor(machine, { input });

    onCleanup(async () => {
      actor.stop();
    });

    return actor;
  });
