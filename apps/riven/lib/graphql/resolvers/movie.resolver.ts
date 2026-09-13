import { Movie } from "@repo/util-plugin-sdk/dto/entities";

import { FieldResolver, Int, Resolver, Root } from "type-graphql";

@Resolver(() => Movie)
export class MovieResolver {
  @FieldResolver(() => Int)
  public expectedFileCount(@Root() movie: Movie) {
    return movie.getExpectedFileCount();
  }
}
