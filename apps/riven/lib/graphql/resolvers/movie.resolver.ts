import { Movie } from "@repo/util-plugin-sdk/dto/entities";

import { FieldResolver, Int, Resolver, Root, Authorized } from "type-graphql";

@Authorized()
@Resolver(() => Movie)
export class MovieResolver {
  @FieldResolver(() => Int)
  public expectedFileCount(@Root() movie: Movie) {
    return movie.getExpectedFileCount();
  }
}
