import z, { type ZodLiteral, ZodObject, type ZodType, type ZodVoid } from "zod";

import { DataSourceMap } from "../../utilities/datasource-map.ts";

import type { RivenEvent, RivenExternalEvent } from "../events/index.ts";
import type { Logger } from "winston";

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
        getSettings: z.custom<
          <T extends ZodObject>(schema: T) => Promise<z.infer<T>>
        >((val) => typeof val === "function"),
        logger: z.custom<Logger>(
          (val) =>
            val && typeof val === "object" && "info" in val && "error" in val,
        ),
      }),
    ],
    output: z.promise(outputSchema),
  });
