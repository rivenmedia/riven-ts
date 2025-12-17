import { Args, Ctx, Query, Resolver } from "type-graphql";
import type { Context } from "@repo/core-util-graphql-schema/context";
import { ExternalIds } from "./external-ids.type.ts";
import { ListIdsArguments } from "./list-ids.arguments.ts";

@Resolver()
export class ListrrResolver {
  @Query((_returns) => [ExternalIds])
  async listrrMovies(
    @Args() { listIds }: ListIdsArguments,
    @Ctx() { dataSources }: Context,
  ): Promise<ExternalIds[]> {
    return await dataSources.listrr.getMovies(new Set(listIds));
  }

  @Query((_returns) => [ExternalIds])
  async listrrShows(
    @Args() { listIds }: ListIdsArguments,
    @Ctx() { dataSources }: Context,
  ): Promise<ExternalIds[]> {
    return await dataSources.listrr.getShows(new Set(listIds));
  }
}
