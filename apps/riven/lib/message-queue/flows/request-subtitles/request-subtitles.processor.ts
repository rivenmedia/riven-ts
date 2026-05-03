import { MediaItem, SubtitleEntry } from "@repo/util-plugin-sdk/dto/entities";

import { UnrecoverableError } from "bullmq";
import assert from "node:assert";

import { database } from "../../../database/database.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { requestSubtitlesProcessorSchema } from "./request-subtitles.schema.ts";

import type { MediaItemSubtitleRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.subtitle-requested.event";

export const requestSubtitlesProcessor =
  requestSubtitlesProcessorSchema.implementAsync(async ({ job }) => {
    const data = await job.getChildrenValues();

    const allSubtitles = Object.values(data).flatMap<
      MediaItemSubtitleRequestedResponse["subtitles"][number]
    >((childData) => childData.subtitles);

    if (allSubtitles.length === 0) {
      logger.debug(`No subtitles returned for media item ID ${job.data.id}`);

      return { count: 0 };
    }

    // Deduplicate by language (first per language wins)
    const uniqueByLanguage = new Map<
      string,
      MediaItemSubtitleRequestedResponse["subtitles"][number]
    >();

    for (const subtitle of allSubtitles) {
      if (!uniqueByLanguage.has(subtitle.language)) {
        uniqueByLanguage.set(subtitle.language, subtitle);
      }
    }

    const count = await database.em
      .fork()
      .transactional(async (transaction) => {
        const item = await transaction.findOne(MediaItem, { id: job.data.id });

        assert(
          item,
          new UnrecoverableError(`Media item with ID ${job.data.id} not found`),
        );

        // Check for existing subtitles to avoid duplicates
        const existingSubtitles = await transaction.find(SubtitleEntry, {
          mediaItem: item.id,
        });

        const existingLanguages = new Set(
          existingSubtitles.map(({ language }) => language),
        );

        let newEntriesCount = 0;

        for (const [language, subtitle] of uniqueByLanguage) {
          if (existingLanguages.has(language)) {
            logger.debug(
              `Subtitle for language "${language}" already exists for ${item.fullTitle}, skipping`,
            );

            continue;
          }

          const entry = transaction.create(SubtitleEntry, {
            language: subtitle.language,
            content: subtitle.content,
            fileHash: subtitle.fileHash,
            fileSize: subtitle.fileSize,
            sourceProvider: subtitle.sourceProvider,
            sourceId: subtitle.sourceId ?? null,
          });

          item.filesystemEntries.add(entry);

          newEntriesCount++;
        }

        if (newEntriesCount > 0) {
          await transaction.persist(item).flush();

          logger.info(
            `Persisted ${newEntriesCount.toString()} subtitle(s) for ${item.fullTitle}`,
          );
        }

        return newEntriesCount;
      });

    return { count };
  });
