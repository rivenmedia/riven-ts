import type { PluginToProgramEvent, ProgramToPluginEvent } from "./events.ts";
import type { RequestedItem } from "../schemas/index.ts";
import type { DataSourceMap } from "../types/utilities.ts";
import type { ApolloClient } from "@apollo/client";
import {
  fromCallback,
  type ActorRef,
  type CallbackLogicFunction,
  type MachineContext,
  type Snapshot,
} from "xstate";

export type ParentRef = ActorRef<
  Snapshot<unknown>,
  PluginToProgramEvent,
  ProgramToPluginEvent
>;

export interface PluginMachineContext extends MachineContext {
  pluginName: symbol;
}

export interface PluginMachineInput {
  client: ApolloClient;
  pluginName: symbol;
  dataSources: DataSourceMap;
}

interface PluginRunnerHelpers extends Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  (this: void, ...args: never[]) => void
> {
  publishEvent: <T extends PluginToProgramEvent["type"]>(
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    this: void,
    event: T,
    params: Omit<Extract<PluginToProgramEvent, { type: T }>, "type" | "plugin">,
  ) => void;
}

type PluginRunner = (params: {
  helpers: PluginRunnerHelpers;
  receive: Parameters<
    CallbackLogicFunction<ProgramToPluginEvent>
  >[0]["receive"];
  input: PluginMachineInput;
}) => Promise<() => void>;

export const createPluginRunner = (callback: PluginRunner) =>
  fromCallback<ProgramToPluginEvent, PluginMachineInput, PluginToProgramEvent>(
    ({ input, sendBack, receive }) => {
      const providePluginName = (
        event: Omit<PluginToProgramEvent, "plugin">,
      ): PluginToProgramEvent => ({
        ...event,
        plugin: input.pluginName,
      });

      const helpers = {
        publishEvent(event, params) {
          sendBack(
            providePluginName({
              type: event,
              ...params,
            }),
          );
        },
        sendMediaRequestedEvent(item: RequestedItem) {
          sendBack(
            providePluginName({
              type: "media:requested",
              item,
            }),
          );
        },
      } satisfies PluginRunnerHelpers;

      return callback({
        input,
        helpers,
        receive,
      }) as unknown as Awaited<ReturnType<PluginRunner>>;
    },
  );

export type PluginActorLogic = ReturnType<typeof createPluginRunner>;
