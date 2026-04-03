/* eslint-disable @typescript-eslint/require-await */
import Fuse from "@zkochan/fuse-native";
import { createActor, createEmptyActor, fromPromise } from "xstate";

import { it as baseIt } from "../../../../__tests__/test-context.ts";
import { bootstrapMachine } from "../../index.ts";

import type {
  InitialiseVfsInput,
  InitialiseVfsOutput,
} from "../../actors/initialise-vfs.actor.ts";

export const it = baseIt
  .extend("input", () => ({
    rootRef: createEmptyActor(),
  }))

  .extend(
    "initialiseDatabaseConnectionActorLogic",
    fromPromise(async () => {
      /* empty */
    }),
  )
  .extend(
    "initialiseVfsActorLogic",
    fromPromise<InitialiseVfsOutput, InitialiseVfsInput>(async () => {
      return {
        vfs: new Fuse("/mnt/fake-path", {}),
      };
    }),
  )
  .extend(
    "machine",
    ({ initialiseDatabaseConnectionActorLogic, initialiseVfsActorLogic }) =>
      bootstrapMachine.provide({
        actors: {
          initialiseDatabaseConnection: initialiseDatabaseConnectionActorLogic,
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
