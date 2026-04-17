import { Season, Show } from "@repo/util-plugin-sdk/dto/entities";

import { Arg, FieldResolver, Int, Resolver, Root } from "type-graphql";

@Resolver(() => Show)
export class ShowResolver {
  @FieldResolver(() => [Season])
  seasons(
    @Root() show: Show,
    @Arg("includeSpecials", () => Boolean, { defaultValue: false })
    includeSpecials: boolean,
  ) {
    return show.seasons.matching({
      where: {
        ...(includeSpecials ? {} : { number: { $ne: 0 } }),
      },
    });
  }

  @FieldResolver(() => Int)
  async expectedFileCount(@Root() show: Show) {
    return show.getExpectedFileCount();
  }
}
