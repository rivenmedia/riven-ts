import { Args, Ctx, Query, Resolver } from "type-graphql";
import { CacheControl } from "@repo/core-util-graphql-helpers/caching/cache-control.directive";
import { ListIdsArguments } from "./list-ids.arguments.ts";
import { ExternalIds } from "./external-ids.type.ts";
import type { ListrrContextSlice } from "../datasource/listrr.datasource.ts";

@Resolver()
export class ListrrResolver {
  @Query((_returns) => Boolean)
  async listrrIsValid(
    @Ctx() { dataSources }: ListrrContextSlice,
  ): Promise<boolean> {
    return dataSources.listrr.validate();
  }

  @CacheControl({ maxAge: 300 })
  @Query((_returns) => [ExternalIds])
  async listrrMovies(
    @Args() { listIds }: ListIdsArguments,
    @Ctx() { dataSources }: ListrrContextSlice,
  ): Promise<ExternalIds[]> {
    return await dataSources.listrr.getMovies(new Set<string>(listIds));
  }

  @CacheControl({ maxAge: 300 })
  @Query((_returns) => [ExternalIds])
  async listrrShows(
    @Args() { listIds }: ListIdsArguments,
    @Ctx() { dataSources }: ListrrContextSlice,
  ): Promise<ExternalIds[]> {
    return await dataSources.listrr.getShows(new Set<string>(listIds));
  }
}
