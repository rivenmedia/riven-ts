import { type Actor, createActor, createEmptyActor } from "xstate";

import { rivenTestContext } from "../../../../__tests__/test-context.ts";
import {
  type PluginRegistrarMachineInput,
  pluginRegistrarMachine,
} from "../../index.ts";

export const it = rivenTestContext.extend<{
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
