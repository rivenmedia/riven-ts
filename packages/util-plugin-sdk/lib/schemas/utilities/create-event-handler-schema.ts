import z, {
  type ZodLiteral,
  type ZodObject,
  type ZodType,
  type ZodVoid,
} from "zod";

import { DataSourceMap } from "../../utilities/datasource-map.ts";
import { PluginSettings } from "../../utilities/plugin-settings.ts";

import type { RivenEvent } from "../events/index.ts";

export const createEventHandlerSchema = <
  I extends { type: ZodLiteral<RivenEvent["type"]> },
  O extends ZodType = ZodVoid,
>(
  inputSchema: ZodObject<I>,
  outputSchema: O = z.void() as never,
) =>
  z.function({
    input: [
      z.object({
        event: inputSchema.omit({ type: true }),
        dataSources: z.instanceof(DataSourceMap),
        settings: z.instanceof(PluginSettings),
      }),
    ],
    output: z.promise(outputSchema),
  });
