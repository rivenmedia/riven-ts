import { Args, Ctx, Query, Resolver } from "type-graphql";
import type { Context } from "@repo/core-util-graphql-schema/context";
import { CacheControl } from "@repo/core-util-graphql-schema/cache-control-directive";
import { ListIdsArguments } from "./list-ids.arguments.ts";
import { ExternalIds } from "./external-ids.type.ts";

@Resolver()
export class ListrrResolver {
  @Query((_returns) => Boolean)
  async listrrIsValid(@Ctx() { dataSources }: Context): Promise<boolean> {
    return dataSources.listrr.validate();
  }

  @CacheControl({ maxAge: 300 })
  @Query((_returns) => [ExternalIds])
  async listrrMovies(
    @Args() { listIds }: ListIdsArguments,
    @Ctx() { dataSources }: Context,
  ): Promise<ExternalIds[]> {
    return await dataSources.listrr.getMovies(new Set<string>(listIds));
  }

  @CacheControl({ maxAge: 300 })
  @Query((_returns) => [ExternalIds])
  async listrrShows(
    @Args() { listIds }: ListIdsArguments,
    @Ctx() { dataSources }: Context,
  ): Promise<ExternalIds[]> {
    return await dataSources.listrr.getShows(new Set<string>(listIds));
  }
}
