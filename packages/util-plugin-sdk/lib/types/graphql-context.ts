import type { RivenEvent } from "../schemas/events/index.ts";
import type { DataSourceMap } from "../utilities/datasource-map.ts";
import type { Logger } from "winston";

export interface GraphQLContext {
  logger: Logger;
  sendEvent: (
    event: Extract<RivenEvent, { type: `riven-external.${string}` }>,
  ) => void;
  plugins: Partial<Record<symbol, { dataSources: DataSourceMap }>>;
}
