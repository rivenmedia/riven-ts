import { logger } from "@repo/core-util-logger";
import {
  type DataSourceMap,
  type PluginRunnerInput,
  type PluginToProgramEvent,
  type ProgramToPluginEvent,
  createPluginRunner,
  createPluginValidator,
} from "@repo/util-plugin-sdk";

import type { ApolloClient } from "@apollo/client";
import {
  type ActorRef,
  type MachineContext,
  type Snapshot,
  assertEvent,
  assign,
  sendTo,
  setup,
  spawnChild,
} from "xstate";

import { processRequestedItem } from "./actors/process-requested-item.actor.ts";

export interface PluginMachineContext extends MachineContext {
  pluginSymbol: symbol;
  pluginPrettyName: string;
  client: ApolloClient;
  dataSources: DataSourceMap;
  validationFailures: number;
  isValidated: boolean;
  parentRef: ActorRef<Snapshot<unknown>, ProgramToPluginEvent>;
}

export interface PluginMachineInput extends PluginRunnerInput {
  parentRef: ActorRef<Snapshot<unknown>, ProgramToPluginEvent>;
}

export type PluginMachineEvent =
  | ProgramToPluginEvent
  | PluginToProgramEvent
  | { type: "riven.validate-plugin" };

export const pluginMachine = setup({
  types: {
    context: {} as PluginMachineContext,
    events: {} as PluginMachineEvent,
    input: {} as PluginMachineInput,
    children: {} as {
      pluginRunner: "pluginRunner";
      processRequestedItem: "processRequestedItem";
      validatePlugin: "validatePlugin";
    },
  },
  actions: {
    resetValidationFailures: assign({
      validationFailures: 0,
    }),
    incrementValidationFailures: assign(({ context }) => ({
      validationFailures: context.validationFailures + 1,
    })),
    processRequestedItem: spawnChild("processRequestedItem", {
      id: "processRequestedItem",
      input: ({ context, event }) => {
        assertEvent(event, "media:requested");

        return {
          item: event.item,
          parentRef: context.parentRef,
        };
      },
    }),
  },
  actors: {
    processRequestedItem,
    pluginRunner: createPluginRunner(async () => {
      /* empty */
    }),
    validatePlugin: createPluginValidator(() => true),
  },
  guards: {
    isPluginValid: (_, isValid: boolean) => isValid,
    hasReachedMaxValidationFailures: ({ context }) =>
      context.validationFailures >= 3,
  },
}).createMachine({
  context: ({
    input: { client, pluginSymbol: pluginSymbol, dataSources, parentRef },
  }) => ({
    client,
    pluginSymbol,
    pluginPrettyName: pluginSymbol.description ?? pluginSymbol.toString(),
    dataSources,
    validationFailures: 0,
    isValidated: false,
    parentRef,
  }),
  id: "Plugin runner",
  initial: "Idle",
  on: {
    "riven.exited": ".Stopped",
  },
  states: {
    Idle: {
      on: {
        "riven.validate-plugin": "Validating",
      },
    },
    Validating: {
      entry: ({ context }) => {
        logger.info(`Validating ${context.pluginPrettyName}`);
      },
      invoke: {
        id: "validatePlugin",
        src: "validatePlugin",
        input: ({ context }) => ({
          client: context.client,
          pluginSymbol: context.pluginSymbol,
          dataSources: context.dataSources,
        }),
        onDone: [
          {
            target: "Validated",
            guard: {
              type: "isPluginValid",
              params: ({ event }) => event.output,
            },
          },
          {
            target: "Validation error",
          },
        ],
        onError: "Validation error",
      },
    },
    Validated: {
      entry: [
        {
          type: "resetValidationFailures",
        },
        ({ context }) => {
          logger.info(`Validated ${context.pluginPrettyName}`);
        },
      ],
      on: {
        "riven.started": "Running",
      },
    },
    "Validation error": {
      entry: [
        {
          type: "incrementValidationFailures",
        },
        ({ context }) => {
          logger.error(`Validation failed for ${context.pluginPrettyName}`);
        },
      ],
      always: {
        guard: "hasReachedMaxValidationFailures",
        target: "Errored",
      },
      after: {
        5000: "Validating",
      },
    },
    Running: {
      on: {
        "riven.media-item.*": {
          actions: sendTo("pluginRunner", ({ event }) => event),
        },
        "media:requested": {
          actions: {
            type: "processRequestedItem",
            params: ({ event }) => ({
              item: event.item,
              plugin: event.plugin,
            }),
          },
        },
      },
      invoke: {
        id: "pluginRunner",
        src: "pluginRunner",
        input: ({ context }) => ({
          pluginSymbol: context.pluginSymbol,
          client: context.client,
          dataSources: context.dataSources,
        }),
        onDone: {
          actions: () => {
            console.log("Plugin runner completed");
          },
        },
        onError: {
          actions: () => {
            console.log("Plugin runner errored");
          },
        },
      },
    },
    Errored: {
      type: "final",
      entry: ({ context }) => {
        logger.error(
          `${context.pluginPrettyName} has errored and will not be started`,
        );
      },
    },
    Stopped: {
      type: "final",
    },
  },
});
