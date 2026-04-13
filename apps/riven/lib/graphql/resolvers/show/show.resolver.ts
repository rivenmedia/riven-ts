import { Season, Show } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

import { reduceAsync } from "es-toolkit";
import {
  Arg,
  Ctx,
  FieldResolver,
  Int,
  Mutation,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";

import {
  IndexShowInput,
  IndexShowMutationResponse,
  indexShowMutation,
} from "./mutations/index-show.mutation.ts";

import type { ApolloServerContext } from "@repo/core-util-graphql-schema";

@Resolver((_of) => Show)
export class ShowResolver {
  @Subscription(() => Show, {
    description: "Subscription triggered when a show is indexed",
    topics: "MEDIA_ITEM_INDEXED",
  })
  showIndexed(@Root() payload: Show): Show {
    return payload;
  }

  @Mutation(() => IndexShowMutationResponse)
  async indexShow(
    @Ctx() { em }: ApolloServerContext,
    @Arg("input", () => IndexShowInput) input: IndexShowInput,
  ): Promise<IndexShowMutationResponse> {
    try {
      const show = await indexShowMutation(em, input);

      return {
        success: true,
        statusText: "ok",
        message: "Show indexed successfully",
        show,
      };
    } catch (error) {
      return {
        success: false,
        statusText: "internal_server_error",
        message: String(error),
        show: null,
      };
    }
  }

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
