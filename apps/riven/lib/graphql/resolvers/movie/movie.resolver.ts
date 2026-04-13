import { Movie } from "@repo/util-plugin-sdk/dto/entities";

import { Arg, Ctx, FieldResolver, Int, Mutation, Resolver } from "type-graphql";

import {
  IndexMovieInput,
  IndexMovieMutationResponse,
  indexMovieMutation,
} from "./mutations/index-movie.mutation.ts";

import type { ApolloServerContext } from "@repo/core-util-graphql-schema";

@Resolver((_of) => Movie)
export class MovieResolver {
  @Mutation(() => IndexMovieMutationResponse)
  async indexMovie(
    @Ctx() { em }: ApolloServerContext,
    @Arg("input", () => IndexMovieInput) input: IndexMovieInput,
  ): Promise<IndexMovieMutationResponse> {
    try {
      const movie = await indexMovieMutation(em, input);

      return {
        success: true,
        statusText: "OK",
        message: "Movie indexed successfully",
        movie,
      };
    } catch (error) {
      return {
        success: false,
        statusText: "INTERNAL_SERVER_ERROR",
        message: String(error),
        movie: null,
      };
    }
  }

  @FieldResolver(() => Int)
  expectedFileCount() {
    return 1;
  }
}
