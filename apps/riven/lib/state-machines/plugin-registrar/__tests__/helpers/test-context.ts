import { createActor, createEmptyActor } from "xstate";

import { rivenTestContext } from "../../../../__tests__/test-context.ts";
import { pluginRegistrarMachine } from "../../index.ts";

export const it = rivenTestContext
  .extend("input", () => ({
    rootRef: createEmptyActor(),
  }))
  .extend("machine", () => pluginRegistrarMachine)
  .extend("actor", ({ machine, input }, { onCleanup }) => {
    const actor = createActor(machine, { input });

    actor.start();

    onCleanup(() => {
      actor.stop();
    });

    return actor;
  });
