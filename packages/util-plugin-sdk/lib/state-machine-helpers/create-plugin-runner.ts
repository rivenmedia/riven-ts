import {
  type ActorRef,
  type CallbackLogicFunction,
  type MachineContext,
  type Snapshot,
  fromCallback,
} from "xstate";

import type { PluginToProgramEvent } from "../events/plugin-to-program-event.ts";
import type { ProgramToPluginEvent } from "../events/program-to-plugin-event.ts";
import type { RequestedItem } from "../schemas/index.ts";
import type { ParamsFor } from "../types/events.ts";
import type { DataSourceMap } from "../types/utilities.ts";

export type ParentRef = ActorRef<
  Snapshot<unknown>,
  PluginToProgramEvent,
  ProgramToPluginEvent
>;

export interface PluginRunnerContext extends MachineContext {
  pluginSymbol: symbol;
}

export interface PluginRunnerInput {
  pluginSymbol: symbol;
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
    params: Omit<
      ParamsFor<Extract<PluginToProgramEvent, { type: T }>>,
      "plugin"
    >,
  ) => void;
}

type PluginRunner = (params: {
  helpers: PluginRunnerHelpers;
  receive: Parameters<
    CallbackLogicFunction<ProgramToPluginEvent>
  >[0]["receive"];
  input: PluginRunnerInput;
}) => ReturnType<CallbackLogicFunction<ProgramToPluginEvent>>;

export const createPluginRunner = (callback: PluginRunner) =>
  fromCallback<ProgramToPluginEvent, PluginRunnerInput, PluginToProgramEvent>(
    ({ input, sendBack, receive }) => {
      const providePluginSymbol = (
        event: Omit<PluginToProgramEvent, "plugin">,
      ): PluginToProgramEvent => ({
        ...event,
        plugin: input.pluginSymbol,
      });

      const helpers = {
        publishEvent(event, params) {
          sendBack(
            providePluginSymbol({
              type: event,
              ...params,
            }),
          );
        },
        sendMediaRequestedEvent(item: RequestedItem) {
          sendBack(
            providePluginSymbol({
              type: "riven-plugin.media-item.requested",
              item,
            }),
          );
        },
      } satisfies PluginRunnerHelpers;

      return callback({
        input,
        helpers,
        receive,
      });
    },
  );

export type PluginRunnerLogic = ReturnType<typeof createPluginRunner>;

export type { ProgramToPluginEvent };
