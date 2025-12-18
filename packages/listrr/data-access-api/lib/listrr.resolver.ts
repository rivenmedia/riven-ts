import { Args, Ctx, Query, Resolver } from "type-graphql";
import type { Context } from "@repo/core-util-graphql-schema/context";
import { CacheControl } from "@repo/core-util-graphql-schema/cache-control-directive";
import { ListIdsArguments } from "./list-ids.arguments.ts";
import { ExternalIds } from "./external-ids.type.ts";

@Resolver()
export class ListrrResolver {
  @CacheControl({
    maxAge: 300,
  })
  @Query((_returns) => [ExternalIds])
  async listrrMovies(
    @Args() { listId }: ListIdsArguments,
    @Ctx() { dataSources }: Context,
  ): Promise<ExternalIds[]> {
    return await dataSources.listrr.getMovies(new Set<string>([listId]));
  }

  @CacheControl({
    maxAge: 300,
  })
  @Query((_returns) => [ExternalIds])
  async listrrShows(
    @Args() { listId }: ListIdsArguments,
    @Ctx() { dataSources }: Context,
  ): Promise<ExternalIds[]> {
    return await dataSources.listrr.getShows(new Set<string>([listId]));
  }
}
