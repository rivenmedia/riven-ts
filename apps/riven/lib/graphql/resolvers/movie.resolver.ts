import { Movie } from "@repo/util-plugin-sdk/dto/entities";

import { Arg, Ctx, FieldResolver, Int, Query, Resolver } from "type-graphql";

import type { ApolloServerContext } from "@repo/core-util-graphql-schema";

@Resolver((_of) => Movie)
export class MovieResolver {
  @Query(() => Movie, {
    description: "Fetches a movie by its TMDB ID.",
  })
  movie(
    @Ctx() { em }: ApolloServerContext,
    @Arg("tmdbId", () => String) tmdbId: string,
  ) {
    return em.findOneOrFail(Movie, {
      tmdbId,
    });
  }

  @FieldResolver(() => Int)
  expectedFileCount() {
    return 1;
  }
}
