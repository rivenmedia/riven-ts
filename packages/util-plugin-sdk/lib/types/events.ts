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
    type: `riven/${Type}`;
  },
  Payload extends never ? {} : Payload
>;

export type ParamsFor<T extends ProgramEvent<string>> = Omit<T, "type">;
