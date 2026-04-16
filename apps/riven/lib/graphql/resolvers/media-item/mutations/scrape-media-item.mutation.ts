import { MediaItem, Stream } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import { MediaItemUnion } from "@repo/util-plugin-sdk/dto/unions/media-item.union";
import { MediaItemScrapeError } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.event";
import { MediaItemScrapeErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.incorrect-state.event";
import { MediaItemScrapeErrorNoNewStreams } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.no-new-streams.event";

import { type EntityManager, ref } from "@mikro-orm/core";
import chalk from "chalk";
import { ValidationError, validateOrReject } from "class-validator";
import { DateTime } from "luxon";
import assert from "node:assert";
import {
  Field,
  ID,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from "type-graphql";
import z from "zod";

import { MutationResponse } from "../../../interfaces/mutation-response.interface.ts";
import { pubSub } from "../../../pub-sub.ts";

import type { ParsedData } from "@repo/util-rank-torrent-name";
import type { UUID } from "node:crypto";

const processableStates = MediaItemState.extract([
  "indexed",
  "ongoing",
  "scraped",
  "partially_completed",
]);

@InputType()
export class ScrapeMediaItemMutationInput {
  @Field(() => ID)
  id!: UUID;

  @Field(() => Object)
  results!: Record<string, ParsedData>;
}

const ScrapeMediaItemMutationErrorCode = z.enum([
  "no_new_streams",
  "incorrect_state",
  "scrape_error",
]);

type ScrapeMediaItemMutationErrorCode = z.infer<
  typeof ScrapeMediaItemMutationErrorCode
>;

registerEnumType(ScrapeMediaItemMutationErrorCode.enum, {
  name: "ScrapeMediaItemMutationErrorCode",
});

@ObjectType({ implements: MutationResponse })
export class ScrapeMediaItemMutationResponse extends MutationResponse {
  @Field(() => ScrapeMediaItemMutationErrorCode.enum, { nullable: true })
  errorCode!: ScrapeMediaItemMutationErrorCode | null;

  @Field(() => MediaItemUnion, { nullable: true })
  item!: MediaItem | null;

  @Field(() => Int, { nullable: true })
  newStreamsCount!: number | null;
}

export async function scrapeMediaItemMutation(
  em: EntityManager,
  { id, results }: ScrapeMediaItemMutationInput,
) {
  const result = await em.transactional(async (transaction) => {
    const existingItem = await transaction
      .getRepository(MediaItem)
      .findOneOrFail(id, { populate: ["streams.infoHash"] });

    assert(
      processableStates.safeParse(existingItem.state).success,
      new MediaItemScrapeErrorIncorrectState({
        item: existingItem,
      }),
    );

    const streamsCount = existingItem.streams.count();

    const infoHashes = Object.keys(results);
    const preScrapedStreams = await transaction.getRepository(Stream).find({
      infoHash: { $in: infoHashes },
    });

    const preScrapedStreamsMap = new Map(
      preScrapedStreams.map((stream) => [stream.infoHash, stream]),
    );

    for (const [infoHash, parsedData] of Object.entries(results)) {
      const existingEntry = preScrapedStreamsMap.get(infoHash);
      const stream =
        existingEntry ?? transaction.create(Stream, { infoHash, parsedData });

      existingItem.streams.add(ref(stream));
    }

    const newStreamsCount = existingItem.streams.count() - streamsCount;

    existingItem.failedAttempts =
      newStreamsCount === 0 ? existingItem.failedAttempts + 1 : 0;

    existingItem.scrapedAt = DateTime.now().toJSDate();
    existingItem.scrapedTimes++;

    try {
      await validateOrReject(existingItem);

      await transaction.persist(existingItem).flush();

      const { logger } = await import("../../../../utilities/logger/logger.ts");

      if (newStreamsCount > 0) {
        logger.info(
          `Added ${newStreamsCount.toString()} new streams to ${chalk.bold(existingItem.fullTitle)}`,
        );
      }
    } catch (error) {
      const errorMessage = z
        .union([z.instanceof(Error), z.array(z.instanceof(ValidationError))])
        .transform((error) => {
          if (Array.isArray(error)) {
            return error
              .map((err) =>
                err.constraints
                  ? Object.values(err.constraints).join("; ")
                  : "",
              )
              .join("; ");
          }

          return error.message;
        })
        .parse(error);

      throw new MediaItemScrapeError({
        item: existingItem,
        error: errorMessage,
      });
    }

    return {
      newStreamsCount,
      existingItem,
    };
  });

  if (result.newStreamsCount === 0) {
    throw new MediaItemScrapeErrorNoNewStreams({
      item: result.existingItem,
    });
  }

  pubSub.publish("MEDIA_ITEM_SCRAPED", {
    item: result.existingItem,
    streamsAdded: result.newStreamsCount,
  });

  return result;
}
