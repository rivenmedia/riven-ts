import { it as baseIt } from "@repo/core-util-vitest-test-context";

import { type Actor, createActor, createEmptyActor } from "xstate";

import {
  type PluginRegistrarMachineInput,
  pluginRegistrarMachine,
} from "../../index.ts";

export const it = baseIt.extend<{
  input: PluginRegistrarMachineInput;
  actor: Actor<typeof pluginRegistrarMachine>;
  machine: typeof pluginRegistrarMachine;
}>({
  input: {
    rootRef: createEmptyActor(),
  },
  machine: pluginRegistrarMachine,
  actor: async ({ machine, input }, use) => {
    const actor = createActor(machine, { input });

    actor.start();

    await use(actor);

    actor.stop();
  },
});
