import { DataSourceMap } from "@repo/util-plugin-sdk";

import { vi } from "vitest";
import { createActor, createEmptyActor } from "xstate";

import { it as baseIt } from "../../../../__tests__/test-context.ts";
import { mainRunnerMachine } from "../../../main-runner/index.ts";

import type { ValidPlugin } from "../../../../types/plugins.ts";
import type { MainRunnerMachineInput } from "../../../main-runner/index.ts";

export const it = baseIt

  .extend(
    "input",
    (): MainRunnerMachineInput => ({
      parentRef: createEmptyActor(),
    }),
  )
  .extend("machine", mainRunnerMachine)
  .extend("actor", async ({ input, machine }, { onCleanup }) => {
    const { default: testPlugin } = await import("@repo/plugin-test");
    const actor = createActor(machine, { id: "Main runner", input });

    actor.send({
      type: "START",
      input: {
        plugins: new Map<symbol, ValidPlugin>([
          [
            testPlugin.name,
            {
              config: testPlugin,
              dataSources: new DataSourceMap(),
              status: "valid",
            },
          ],
        ]),
        publishableEvents: new Set(),
        pluginQueues: new Map(),
        pluginWorkers: new Map(),
      },
    });

    vi.spyOn(actor, "send");

    onCleanup(() => {
      actor.stop();
    });

    return actor;
  });
