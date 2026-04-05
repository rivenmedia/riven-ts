import { Movie } from "@repo/util-plugin-sdk/dto/entities";

import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";

import {
  PersistMovieIndexerDataInput,
  persistMovieIndexerData,
} from "../mutations/persist-movie-indexer-data.ts";
import {
  PersistMovieItemRequestInput,
  PersistMovieItemRequestOutput,
  persistMovieItemRequest,
} from "../mutations/persist-movie-item-request.ts";

import type { ApolloServerContext } from "@repo/core-util-graphql-schema";

@Resolver((_of) => Movie)
export class MovieResolver {
  @Query(() => Movie)
  async movie(
    @Ctx() { em }: ApolloServerContext,
    @Arg("id") id: number,
  ): Promise<Movie> {
    return em.findOneOrFail(Movie, id);
  }

  @Mutation(() => PersistMovieItemRequestOutput)
  async persistMovieItemRequest(
    @Ctx() { em }: ApolloServerContext,
    @Arg("input", () => PersistMovieItemRequestInput)
    input: PersistMovieItemRequestInput,
  ): Promise<PersistMovieItemRequestOutput> {
    return persistMovieItemRequest(input, em);
  }

  @Mutation(() => Movie)
  async persistMovieIndexData(
    @Ctx() { em }: ApolloServerContext,
    @Arg("input", () => PersistMovieIndexerDataInput)
    input: PersistMovieIndexerDataInput,
  ): Promise<Movie> {
    return persistMovieIndexerData(input, em);
  }
}
