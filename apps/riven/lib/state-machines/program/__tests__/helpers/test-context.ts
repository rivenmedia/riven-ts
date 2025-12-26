/* eslint-disable no-empty-pattern */

import { programStateMachine } from "../../index.ts";
import { it as baseIt } from "@repo/core-util-vitest-test-context";
import { createActor, type Actor } from "xstate";

export const it = baseIt.extend<{
  actor: Actor<typeof programStateMachine>;
}>({
  actor: async ({}, use) => {
    const actor = createActor(programStateMachine, {
      input: {},
    });

    actor.start();

    await use(actor);

    actor.stop();
  },
});
