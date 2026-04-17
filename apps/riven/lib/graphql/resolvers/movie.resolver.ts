import { Movie } from "@repo/util-plugin-sdk/dto/entities";

import { FieldResolver, Int, Resolver } from "type-graphql";

@Resolver(() => Movie)
export class MovieResolver {
  @FieldResolver(() => Int)
  expectedFileCount() {
    return 1;
  }
}
