import {
  Episode,
  MediaEntry,
  MediaItem,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import { MediaItemUnion } from "@repo/util-plugin-sdk/dto/unions/media-item.union";
import { MediaItemDownloadError } from "@repo/util-plugin-sdk/schemas/events/media-item.download.error.event";
import { MediaItemDownloadErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.download.incorrect-state.event";

import { type EntityManager, ref } from "@mikro-orm/core";
import { UnrecoverableError } from "bullmq";
import { ValidationError, validateOrReject } from "class-validator";
import { DateTime } from "luxon";
import assert from "node:assert";
import { Field, ID, InputType, ObjectType } from "type-graphql";
import z from "zod";

import { MutationResponse } from "../../../interfaces/mutation-response.interface.ts";
import { pubSub } from "../../../pub-sub.ts";

import type { ValidTorrent } from "../../../../message-queue/flows/download-item/steps/find-valid-torrent/find-valid-torrent.schema.ts";
import type { UUID } from "node:crypto";

const processableStates = MediaItemState.extract([
  "scraped",
  "ongoing",
  "partially_completed",
]);

const processableEpisodeStates = MediaItemState.exclude([
  "completed",
  "downloaded",
]);

@InputType()
export class DownloadMediaItemMutationInput {
  @Field(() => ID)
  id!: UUID;

  @Field(() => Object)
  torrent!: ValidTorrent;

  @Field(() => String)
  processedBy!: string;
}

@ObjectType({ implements: MutationResponse })
export class DownloadMediaItemMutationResponse extends MutationResponse {
  @Field(() => MediaItemUnion, { nullable: true })
  item!: MediaItem;
}

export async function downloadMediaItemMutation(
  em: EntityManager,
  { id, torrent, processedBy }: DownloadMediaItemMutationInput,
) {
  const result = await em.transactional(async (transaction) => {
    const existingItem = await transaction.getRepository(MediaItem).findOne(
      {
        streams: {
          infoHash: torrent.infoHash,
        },
        id,
      },
      {
        populate: ["streams.infoHash", "filesystemEntries:ref"],
      },
    );

    assert(
      existingItem,
      new UnrecoverableError(
        `No media item found with ID ${id} and stream info hash ${torrent.infoHash}`,
      ),
    );

    assert(
      processableStates.safeParse(existingItem.state).success,
      new MediaItemDownloadErrorIncorrectState({
        item: existingItem,
      }),
    );

    try {
      const matchedStream = existingItem.streams.find(
        ({ infoHash }) => infoHash === torrent.infoHash,
      );

      assert(
        matchedStream,
        new UnrecoverableError(
          `Media item with ID ${id} does not have a stream matching the torrent's info hash ${torrent.infoHash}`,
        ),
      );

      existingItem.activeStream = ref(matchedStream);

      if (existingItem instanceof Movie || existingItem instanceof Episode) {
        const [file] = torrent.files;

        assert(file?.link, "Download URL is missing for the matched file");

        existingItem.filesystemEntries.add(
          transaction.create(MediaEntry, {
            fileSize: file.size,
            originalFilename: file.name,
            mediaItem: ref(existingItem),
            provider: torrent.provider,
            providerDownloadId: torrent.torrentId,
            downloadUrl: file.link,
            plugin: processedBy,
          }),
        );
      }

      if (existingItem instanceof Show || existingItem instanceof Season) {
        const episodes = await transaction.getRepository(Episode).find({
          id: {
            $in: torrent.files.map((file) => file.matchedMediaItemId),
          },
        });

        assert(
          episodes.length === torrent.files.length,
          new UnrecoverableError(
            "Unable to find all matched media items from the torrent",
          ),
        );

        const episodeMap = new Map<string, Episode>(
          episodes.map((episode) => [episode.id, episode]),
        );

        for (const file of torrent.files) {
          assert(file.link, "Download URL is missing for the matched file");

          const episode = episodeMap.get(file.matchedMediaItemId);

          assert(
            episode,
            new UnrecoverableError(
              `File ${file.name} does not correspond to a valid episode`,
            ),
          );

          if (!processableEpisodeStates.safeParse(episode.state).success) {
            const { logger } =
              await import("../../../../utilities/logger/logger.ts");

            logger.debug(
              `Skipping media entry creation for ${episode.fullTitle} due to "${episode.state}" state`,
            );

            continue;
          }

          episode.filesystemEntries.add(
            transaction.create(MediaEntry, {
              fileSize: file.size,
              originalFilename: file.name,
              mediaItem: ref(episode),
              provider: torrent.provider,
              providerDownloadId: torrent.torrentId,
              downloadUrl: file.link,
              plugin: processedBy,
            }),
          );

          transaction.persist(episode);
        }
      }

      await validateOrReject(existingItem);

      await transaction.persist(existingItem).flush();

      return existingItem;
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

      throw new MediaItemDownloadError({
        item: existingItem,
        error: errorMessage,
      });
    }
  });

  pubSub.publish("MEDIA_ITEM_DOWNLOADED", {
    item: result,
    downloader: processedBy,
    provider: torrent.provider,
    durationFromRequestToDownload: DateTime.utc()
      .diff(DateTime.fromJSDate(result.createdAt))
      .as("seconds"),
  });

  return result;
}
