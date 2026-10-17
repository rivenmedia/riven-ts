import z from "zod";

import { TopLevelMediaItemType } from "../../dto/enums/top-level-media-item-type.enum.ts";
import { DataSourceMap } from "../../utilities/datasource-map.ts";

import type { IndexerData } from "../../dto/types/indexer-data.type.ts";
import type { Logger } from "winston";
import type { ZodObject, ZodType } from "zod";

/**
 * The data a plugin returns for an indexer item.
 *
 * `year` and `runtime` are derived getters on {@link IndexerData}, so plugins do not provide them.
 */
export type IndexerDataResult = Omit<IndexerData, "year" | "runtime">;

/**
 * A class decorated with `@ObjectType({ implements: IndexerData })`.
 *
 * Core instantiates results as this class so GraphQL can resolve the concrete type
 * behind the `IndexerData` interface, and so the plugin's own field resolvers run.
 */
const IndexerDataClass = z.custom<new () => IndexerDataResult>(
  (value) => typeof value === "function",
);

const IndexerDataResult = z.custom<IndexerDataResult>(
  (value) => typeof value === "object" && value !== null && "id" in value,
);

const createQueryHandlerSchema = <A extends ZodObject, O extends ZodType>(
  argsSchema: A,
  outputSchema: O,
) =>
  z.object({
    type: IndexerDataClass,
    /**
     * The media types this handler can return. Core skips the handler for any other type.
     */
    mediaTypes: z.array(TopLevelMediaItemType).min(1),
    handler: z.function({
      input: [
        z.object({
          args: argsSchema,
          dataSources: z.instanceof(DataSourceMap),
          logger: z.custom<Logger>(
            (val) =>
              val && typeof val === "object" && "info" in val && "error" in val,
          ),
        }),
      ],
      output: z.promise(outputSchema),
    }),
  });

export const SearchQueryArgs = z.object({
  query: z.string().trim().min(1),
  type: TopLevelMediaItemType.nullable(),
});

export type SearchQueryArgs = z.infer<typeof SearchQueryArgs>;

export const IndexerItemQueryArgs = z.object({
  id: z.string().min(1),
  type: TopLevelMediaItemType,
});

export type IndexerItemQueryArgs = z.infer<typeof IndexerItemQueryArgs>;

/**
 * Handlers that plugins can register to contribute to core GraphQL queries.
 *
 * Unlike hooks, these run in-process during the GraphQL request rather than via the queue,
 * as the caller is waiting on the response.
 *
 * - `search`: called on every plugin that supports the requested type; results are merged.
 * - `indexerItem`: called on each plugin that supports the requested type, in registration order,
 *   until one returns a non-null result.
 */
export const RivenQueryHandlers = {
  search: createQueryHandlerSchema(SearchQueryArgs, z.array(IndexerDataResult)),
  indexerItem: createQueryHandlerSchema(
    IndexerItemQueryArgs,
    IndexerDataResult.nullable(),
  ),
};

export type RivenQueryHandlerName = keyof typeof RivenQueryHandlers;

export type RivenQueryHandler<T extends RivenQueryHandlerName> = z.infer<
  (typeof RivenQueryHandlers)[T]
>;
