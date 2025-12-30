import { processRequestedItem } from "./actors/process-requested-item.actor.ts";
import type { ApolloClient } from "@apollo/client";
import {
  type DataSourceMap,
  type PluginActorLogic,
  type PluginMachineInput,
  type PluginToProgramEvent,
  type ProgramToPluginEvent,
} from "@repo/util-plugin-sdk";
import {
  setup,
  type MachineContext,
  spawnChild,
  assertEvent,
  createEmptyActor,
} from "xstate";

interface PluginMachineContext extends MachineContext {
  pluginName: symbol;
  client: ApolloClient;
  dataSources: DataSourceMap;
}

export const pluginMachine = setup({
  types: {
    context: {} as PluginMachineContext,
    emitted: {} as PluginToProgramEvent,
    events: {} as ProgramToPluginEvent | PluginToProgramEvent,
    input: {} as PluginMachineInput,
    children: {} as {
      plugin: "plugin";
      processRequestedItem: "processRequestedItem";
    },
  },
  actors: {
    plugin: createEmptyActor() as unknown as PluginActorLogic,
    processRequestedItem,
  },
}).createMachine({
  context: ({ input: { client, pluginName, dataSources } }) => ({
    client,
    pluginName,
    dataSources,
  }),
  id: "Plugin runner",
  initial: "Idle",
  on: {
    "riven.exited": ".Stopped",
  },
  states: {
    Idle: {
      on: {
        "riven.started": "Running",
      },
    },
    Running: {
      on: {
        "media:requested": {
          actions: spawnChild("processRequestedItem", {
            id: "processRequestedItem",
            input: ({ event }) => {
              assertEvent(event, "media:requested");

              return {
                item: event.item,
              };
            },
          }),
        },
      },
      invoke: {
        id: "plugin",
        src: "plugin",
        input: ({ context }) => ({
          pluginName: context.pluginName,
          client: context.client,
          dataSources: context.dataSources,
        }),
      },
    },
    Errored: {},
    Stopped: {},
  },
});
