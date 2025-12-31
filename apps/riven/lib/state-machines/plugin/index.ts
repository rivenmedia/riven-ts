import { processRequestedItem } from "./actors/process-requested-item.actor.ts";
import type { ApolloClient } from "@apollo/client";
import { logger } from "@repo/core-util-logger";
import {
  type DataSourceMap,
  type PluginRunnerLogic,
  type PluginRunnerInput,
  type PluginToProgramEvent,
  type ProgramToPluginEvent,
  type PluginValidatorLogic,
} from "@repo/util-plugin-sdk";
import {
  setup,
  type MachineContext,
  spawnChild,
  assertEvent,
  createEmptyActor,
  assign,
} from "xstate";

interface PluginMachineContext extends MachineContext {
  pluginSymbol: symbol;
  pluginPrettyName: string;
  client: ApolloClient;
  dataSources: DataSourceMap;
  validationFailures: number;
  isValidated: boolean;
}

export const pluginMachine = setup({
  types: {
    context: {} as PluginMachineContext,
    events: {} as
      | ProgramToPluginEvent
      | PluginToProgramEvent
      | { type: "riven:validate-plugin" },
    input: {} as PluginRunnerInput,
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
      input: ({ event }) => {
        assertEvent(event, "media:requested");

        return {
          item: event.item,
        };
      },
    }),
  },
  actors: {
    processRequestedItem,
    pluginRunner: createEmptyActor() as unknown as PluginRunnerLogic,
    validatePlugin: createEmptyActor() as unknown as PluginValidatorLogic,
  },
  guards: {
    isPluginValid: (_, validationResult: boolean) => validationResult,
    hasReachedMaxValidationFailures: ({ context }) =>
      context.validationFailures >= 3,
  },
}).createMachine({
  context: ({
    input: { client, pluginSymbol: pluginSymbol, dataSources },
  }) => ({
    client,
    pluginSymbol,
    pluginPrettyName: pluginSymbol.description ?? pluginSymbol.toString(),
    dataSources,
    validationFailures: 0,
    isValidated: false,
  }),
  id: "Plugin runner",
  initial: "Idle",
  on: {
    "riven.exited": ".Stopped",
  },
  states: {
    Idle: {
      on: {
        "riven:validate-plugin": "Validating",
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
      after: {
        5000: [
          {
            target: "Errored",
            guard: "hasReachedMaxValidationFailures",
          },
          {
            target: "Validating",
          },
        ],
      },
    },
    Running: {
      on: {
        "media:requested": {
          actions: {
            type: "processRequestedItem",
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
