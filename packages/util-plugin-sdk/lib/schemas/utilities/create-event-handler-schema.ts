import z from "zod";

import { DataSourceMap } from "../../utilities/datasource-map.ts";
import { PluginSettings } from "../../utilities/plugin-settings.ts";
import { LoggerSchema } from "../logger.schema.ts";

import type { RivenEvent, RivenExternalEvent } from "../events/index.ts";
import type { ZodLiteral, ZodObject, ZodType, ZodVoid } from "zod";

export const createEventHandlerSchema = <
  I extends {
    type: ZodLiteral<RivenEvent["type"] | RivenExternalEvent["type"]>;
  },
  O extends ZodType = ZodVoid,
>(
  inputSchema: ZodObject<
    I & { type: ZodLiteral<RivenEvent["type"] | RivenExternalEvent["type"]> }
  >,
  outputSchema: O = z.void() as never,
) =>
  z.function({
    input: [
      z.object({
        event: inputSchema.omit({ type: true }),
        dataSources: z.instanceof(DataSourceMap),
        settings: z.instanceof(PluginSettings),
        logger: LoggerSchema,
      }),
    ],
    output: z.promise(outputSchema),
  });
