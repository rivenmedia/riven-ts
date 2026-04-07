import { Season, Show } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

import { reduceAsync } from "es-toolkit";
import { Arg, FieldResolver, Int, Resolver, Root } from "type-graphql";

@Resolver((_of) => Show)
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
    const processableStates = MediaItemState.exclude(["unreleased", "ongoing"]);

    const seasons = await show.getStandardSeasons(processableStates.options);
    const expectedSeasons =
      show.status === "continuing" ? seasons.length - 1 : seasons.length;

    return reduceAsync(
      seasons.slice(0, Math.max(1, expectedSeasons)),
      async (acc, season) => acc + (await season.episodes.loadCount()),
      0,
    );
  }
}
