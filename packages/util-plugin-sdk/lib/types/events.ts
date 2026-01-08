/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { Merge } from "type-fest";

/**
 * Base type for program events.
 */
export type ProgramEvent<
  Type extends string,
  Payload extends Record<string, unknown> = {},
> = Merge<
  {
    type: `riven.${Type}`;
  },
  Payload extends never ? {} : Payload
>;

/**
 * Base type for plugin events.
 */
export type PluginEvent<
  Type extends string,
  Payload extends Record<string, unknown> = {},
> = Merge<
  {
    type: `riven-plugin.${Type}`;
    plugin: string;
  },
  Payload extends never ? {} : Payload
>;

export type ParamsFor<T extends PluginEvent<string> | ProgramEvent<string>> =
  Omit<T, "type">;
