/* eslint-disable @typescript-eslint/require-await */

import { bootstrapMachine } from "../../index.ts";
import { it as baseIt } from "@repo/core-util-vitest-test-context";
import { createActor, fromPromise, type Actor } from "xstate";

export const it = baseIt.extend<{
  actor: Actor<typeof bootstrapMachine>;
  machine: typeof bootstrapMachine;
}>({
  machine: bootstrapMachine,
  actor: async ({ apolloServerInstance }, use) => {
    const actor = createActor(
      bootstrapMachine.provide({
        actors: {
          initialiseDatabaseConnection: fromPromise(async () => {
            /* empty */
          }),
          startGqlServer: fromPromise(async () => {
            return {
              server: apolloServerInstance,
              url: "http://localhost:4000/graphql",
            };
          }),
          stopGqlServer: fromPromise(async () => undefined),
        },
      }),
      {
        input: {
          cache: {} as never,
          sessionId: crypto.randomUUID(),
        },
      },
    );

    actor.start();

    await use(actor);

    actor.stop();
  },
});
