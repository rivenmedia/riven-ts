import { Movie } from "@rivenmedia/plugin-sdk/dto/entities";

import { FieldResolver, Int, Resolver, Root } from "type-graphql";

@Resolver(() => Movie)
export class MovieResolver {
  @FieldResolver(() => Int)
  expectedFileCount(@Root() movie: Movie) {
    return movie.getExpectedFileCount();
  }
}
