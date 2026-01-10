import z, { type ZodArray, type ZodLiteral, type ZodObject } from "zod";

import { DataSourceMap } from "../../types/utilities.ts";

import type { RivenEvent } from "../events/index.ts";

export const createEventHandlerSchema = <
  I extends { type: ZodLiteral<RivenEvent["type"]> },
  O extends ZodObject | ZodArray<ZodObject>,
>(
  inputSchema: ZodObject<I>,
  outputSchema?: O,
) =>
  z.function({
    input: [
      z.object({
        event: inputSchema.omit({ type: true }),
        dataSources: z.instanceof(DataSourceMap),
      }),
    ],
    output: z.promise(outputSchema ?? z.void()),
  });
