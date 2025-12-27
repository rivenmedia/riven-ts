/* eslint-disable no-empty-pattern */

import { bootstrapMachine } from "../../index.ts";
import { it as baseIt } from "@repo/core-util-vitest-test-context";
import { createActor, type Actor } from "xstate";

export const it = baseIt.extend<{
  actor: Actor<typeof bootstrapMachine>;
}>({
  actor: async ({}, use) => {
    const actor = createActor(bootstrapMachine, {
      input: {},
    });

    actor.start();

    await use(actor);

    actor.stop();
  },
});
