import { ListIdsArguments } from "./arguments/list-ids.arguments.ts";
import { ExternalIds } from "./types/external-ids.type.ts";
import type { ListrrContextSlice } from "../datasource/listrr.datasource.ts";
import { CacheControl } from "@repo/core-util-graphql-helpers/caching/cache-control.directive";
import { Args, Ctx, Query, Resolver } from "type-graphql";

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
