import { vi } from "vitest";
import { createActor, createEmptyActor } from "xstate";

import { it as baseIt } from "../../../../__tests__/test-context.ts";
import {
  type MainRunnerMachineInput,
  mainRunnerMachine,
} from "../../../main-runner/index.ts";

export const it = baseIt

  .extend(
    "input",
    (): MainRunnerMachineInput => ({
      parentRef: createEmptyActor(),
    }),
  )
  .extend("machine", mainRunnerMachine)
  .extend("actor", ({ input, machine }, { onCleanup }) => {
    const actor = createActor(machine, { id: "Main runner", input });

    vi.spyOn(actor, "send");

    onCleanup(() => {
      actor.stop();
    });

    return actor;
  });
