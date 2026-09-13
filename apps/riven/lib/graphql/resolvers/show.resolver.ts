import { Season, Show } from "@repo/util-plugin-sdk/dto/entities";

import { Arg, FieldResolver, Int, Resolver, Root } from "type-graphql";

@Resolver(() => Show)
export class ShowResolver {
  @FieldResolver(() => [Season])
  public async seasons(
    @Root() show: Show,
    @Arg("includeUnrequestedSeasons", () => Boolean, { defaultValue: false })
    includeUnrequestedSeasons: boolean,
    @Arg("includeSpecials", () => Boolean, { defaultValue: false })
    includeSpecials: boolean,
  ) {
    return show.seasons.matching({
      where: {
        ...(!includeSpecials && { number: { $ne: 0 } }),
        ...(!includeUnrequestedSeasons && { isRequested: true }),
      },
      orderBy: {
        number: "asc",
      },
    });
  }

  @FieldResolver(() => Int)
  public async expectedFileCount(@Root() show: Show) {
    return show.getExpectedFileCount();
  }
}
