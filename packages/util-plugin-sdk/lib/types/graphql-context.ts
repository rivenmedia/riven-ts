import type { RivenExternalEvent } from "../schemas/events/index.ts";
import type { DataSourceMap } from "../utilities/datasource-map.ts";
import type { Logger } from "winston";

export interface GraphQLContext {
  logger: Logger;
  sendEvent: (event: RivenExternalEvent) => void;
  plugins: Partial<Record<symbol, { dataSources: DataSourceMap }>>;
}
