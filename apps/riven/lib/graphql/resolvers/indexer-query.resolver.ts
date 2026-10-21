import { TopLevelMediaItemType } from "@repo/util-plugin-sdk/dto/enums/top-level-media-item-type.enum";
import { IndexerData } from "@repo/util-plugin-sdk/dto/types/indexer-data.type";

import {
  Arg,
  Ctx,
  Field,
  ID,
  Int,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";

import type { ApolloServerContext } from "#graphql/context.ts";
import type {
  IndexerDataResult,
  RivenQueryHandler,
  RivenQueryHandlerName,
} from "@repo/util-plugin-sdk/schemas/query-handlers/index";

@ObjectType()
class SearchResult {
  @Field({ description: "The plugin that returned this item." })
  public plugin!: string;

  @Field(() => IndexerData)
  public item!: IndexerDataResult;
}

@ObjectType()
class QueryHandlerError {
  @Field()
  public plugin!: string;

  @Field()
  public message!: string;
}

@ObjectType()
class SearchResponse {
  @Field(() => [SearchResult])
  public results!: SearchResult[];

  @Field(() => [QueryHandlerError], {
    description:
      "Plugins that failed to respond. Results from other plugins are still returned.",
  })
  public errors!: QueryHandlerError[];
}

function* getQueryHandlers<T extends RivenQueryHandlerName>(
  plugins: ApolloServerContext["plugins"],
  name: T,
  type: TopLevelMediaItemType | null,
) {
  for (const [pluginSymbol, { config, dataSources }] of plugins) {
    const queryHandler = config.queryHandlers?.[name] as
      | RivenQueryHandler<T>
      | undefined;

    if (!queryHandler || (type && !queryHandler.mediaTypes.includes(type))) {
      continue;
    }

    yield {
      pluginName: pluginSymbol.description ?? "unknown",
      queryHandler,
      dataSources,
    };
  }
}

/**
 * Instantiate the result as the plugin's own ObjectType, so the IndexerData interface can
 * resolve its concrete type, and the plugin's field resolvers apply to it.
 */
const toObjectType = (
  { type: ObjectTypeClass }: { type: new () => IndexerDataResult },
  result: IndexerDataResult,
) => Object.assign(new ObjectTypeClass(), result);

/**
 * Merge per-plugin result lists by taking one from each in turn,
 * so a single plugin's results do not crowd out the others.
 */
const interleave = <T>(lists: T[][]) => {
  const longest = Math.max(0, ...lists.map((list) => list.length));

  return Array.from({ length: longest }, (_, index) =>
    lists.flatMap((list) => list.slice(index, index + 1)),
  ).flat();
};

@Resolver()
export class IndexerQueryResolver {
  @Query(() => SearchResponse, {
    description: "Search across all plugins that provide a search handler.",
  })
  public async search(
    @Ctx() { plugins, logger }: ApolloServerContext,
    @Arg("query") query: string,
    @Arg("type", () => TopLevelMediaItemType.enum, { nullable: true })
    type: TopLevelMediaItemType | null = null,
    @Arg("page", () => Int, { defaultValue: 1 }) page = 1,
  ): Promise<SearchResponse> {
    const handlers = [...getQueryHandlers(plugins, "search", type)];

    const settled = await Promise.allSettled(
      handlers.map(async ({ pluginName, queryHandler, dataSources }) => {
        const items = await queryHandler.handler({
          args: { query, page, type },
          dataSources,
          logger,
        });

        return items.map<SearchResult>((item) => ({
          plugin: pluginName,
          item: toObjectType(queryHandler, item),
        }));
      }),
    );

    const resultLists: SearchResult[][] = [];
    const errors: QueryHandlerError[] = [];

    for (const [index, outcome] of settled.entries()) {
      const { pluginName } = handlers[index] ?? { pluginName: "unknown" };

      if (outcome.status === "fulfilled") {
        resultLists.push(outcome.value);

        continue;
      }

      const error: unknown = outcome.reason;

      logger.warn(`Search handler for ${pluginName} failed`, { err: error });

      errors.push({
        plugin: pluginName,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    return {
      results: interleave(resultLists),
      errors,
    };
  }

  @Query(() => IndexerData, {
    nullable: true,
    description:
      "Look up a single item from the first plugin that can provide it.",
  })
  public async indexerItem(
    @Arg("id", () => ID) id: string,
    @Arg("type", () => TopLevelMediaItemType.enum)
    type: TopLevelMediaItemType,
    @Ctx() { plugins, logger }: ApolloServerContext,
  ): Promise<IndexerDataResult | null> {
    const errors: unknown[] = [];

    for (const { pluginName, queryHandler, dataSources } of getQueryHandlers(
      plugins,
      "indexerItem",
      type,
    )) {
      try {
        const item = await queryHandler.handler({
          args: { id, type },
          dataSources,
          logger,
        });

        if (item) {
          return toObjectType(queryHandler, item);
        }
      } catch (error) {
        logger.warn(`Item handler for ${pluginName} failed`, { err: error });

        errors.push(error);
      }
    }

    if (errors.length > 0) {
      throw new AggregateError(errors, `Unable to resolve ${type} ${id}`);
    }

    return null;
  }
}
