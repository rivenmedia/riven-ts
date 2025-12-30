import type { RequestedItem } from "../schemas/index.ts";
import type { Merge, NonEmptyString } from "type-fest";

type ProgramEvent<
  Type extends string,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  Payload extends Record<string, unknown> = {},
> = Merge<
  {
    type: NonEmptyString<Type>;
  },
  Payload
>;

type PluginEvent<
  Type extends string,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  Payload extends Record<string, unknown> = {},
> = Merge<
  {
    type: Type;
    plugin: symbol;
  },
  Payload
>;

export type ProgramToPluginEvent =
  | ProgramEvent<"riven.started">
  | ProgramEvent<"riven.exited">;

export type PluginToProgramEvent = PluginEvent<
  "media:requested",
  { item: RequestedItem }
>;

export type RivenEvent = ProgramToPluginEvent | PluginToProgramEvent;
