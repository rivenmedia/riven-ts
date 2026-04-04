import { type Type, type } from "arktype";
import { Logger } from "winston";

import { DataSourceMap } from "../../utilities/datasource-map.ts";
import { PluginSettings } from "../../utilities/plugin-settings.ts";

import type { RivenEvent } from "../events/index.ts";

const jobContext = type({
  dataSources: type.instanceOf(DataSourceMap),
  settings: type.instanceOf(PluginSettings),
  logger: type.instanceOf(Logger),
});

type JobContext = typeof jobContext.infer;

export const createEventHandlerSchema = <
  I extends Type<{ type: RivenEvent["type"] }>,
  O extends Type,
>(
  inputSchema: I,
  outputSchema?: O,
) =>
  type.fn.raw(inputSchema.omit("type"), jobContext, ":", outputSchema) as (
    event: I["infer"],
    context: JobContext,
  ) => Promise<O["infer"]>;
