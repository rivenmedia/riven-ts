import { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemUnion } from "@repo/util-plugin-sdk/dto/unions/media-item.union";
import { MediaItemScrapeError } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.event";
import { MediaItemScrapeErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.incorrect-state.event";
import { MediaItemScrapeErrorNoNewStreams } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.no-new-streams.event";

import {
  Arg,
  Ctx,
  FieldResolver,
  ID,
  Int,
  Mutation,
  Query,
  Resolver,
} from "type-graphql";

import {
  ScrapeMediaItemMutationInput,
  ScrapeMediaItemMutationResponse,
  scrapeMediaItemMutation,
} from "./mutations/scrape-media-item.mutation.ts";

import type { ApolloServerContext } from "@repo/core-util-graphql-schema";
import type { UUID } from "node:crypto";

@Resolver((_of) => MediaItem)
export class MediaItemResolver {
  @Query(() => MediaItemUnion, {
    description:
      "Fetches a media item by its ID. The returned type will be one of the specific media item types (e.g., Movie, Episode) based on the underlying data.",
  })
  mediaItemById(
    @Ctx() { em }: ApolloServerContext,
    @Arg("id", () => ID) id: UUID,
  ) {
    return em.findOneOrFail(MediaItem, id);
  }

  @Query(() => [MediaItem])
  mediaItems(@Ctx() { em }: ApolloServerContext): Promise<MediaItem[]> {
    return em.find(
      MediaItem,
      {},
      {
        limit: 25,
        overfetch: true,
      },
    );
  }

  @FieldResolver(() => Int)
  expectedFileCount() {
    throw new Error(
      "expectedFileCount field resolver must be implemented in child resolvers",
    );
  }

  @Mutation(() => ScrapeMediaItemMutationResponse)
  async scrapeMediaItem(
    @Ctx() { em }: ApolloServerContext,
    @Arg("input", () => ScrapeMediaItemMutationInput)
    input: ScrapeMediaItemMutationInput,
  ): Promise<ScrapeMediaItemMutationResponse> {
    try {
      const result = await scrapeMediaItemMutation(em, input);

      return {
        message: "Media item scraped successfully",
        statusText: "ok",
        success: true,
        item: result.existingItem,
        newStreamsCount: result.newStreamsCount,
        errorCode: null,
      };
    } catch (error) {
      if (error instanceof MediaItemScrapeErrorNoNewStreams) {
        return {
          message: String(error),
          statusText: "ok",
          success: true,
          item: error.payload.item,
          newStreamsCount: 0,
          errorCode: "no_new_streams",
        };
      }

      if (error instanceof MediaItemScrapeErrorIncorrectState) {
        return {
          message: String(error),
          statusText: "bad_request",
          success: false,
          item: error.payload.item,
          newStreamsCount: null,
          errorCode: "incorrect_state",
        };
      }

      if (error instanceof MediaItemScrapeError) {
        return {
          message: String(error),
          statusText: "internal_server_error",
          success: false,
          item: error.payload.item,
          newStreamsCount: null,
          errorCode: "scrape_error",
        };
      }

      throw error;
    }
  }
}
