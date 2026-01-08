import z, { type ZodObject } from "zod";

import { DataSourceMap } from "../../types/utilities.ts";
import { PluginToProgramEvent } from "../plugin-to-program-events/index.js";

export const createEventHandlerSchema = <T extends ZodObject>(eventSchema: T) =>
  z.function({
    input: [
      z.object({
        event: eventSchema,
        dataSources: z.instanceof(DataSourceMap),
        publishEvent: z.function({
          input: [
            z.union(
              PluginToProgramEvent.options.map((option) => {
                const { plugin, ...shape } = option.shape;

                return z.object(shape);
              }),
            ),
          ],
          output: z.promise(z.void()),
        }),
      }),
    ],
  });
