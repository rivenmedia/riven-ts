import { MediaItem, SubtitleEntry } from "@repo/util-plugin-sdk/dto/entities";

import { logger } from "../../../../utilities/logger/logger.ts";

import type { EntityManager } from "@mikro-orm/core";
import type { SubtitleData } from "@repo/util-plugin-sdk/schemas/events/media-item.subtitle-requested.event";
import type { UUID } from "node:crypto";

export async function saveSubtitles(
  em: EntityManager,
  mediaItemId: UUID,
  subtitles: Map<string, SubtitleData>,
) {
  const item = await em.findOneOrFail(MediaItem, mediaItemId);

  // Check for existing subtitles to avoid duplicates
  const existingSubtitles = await em.find(
    SubtitleEntry,
    { mediaItem: item.id },
    { fields: ["language"] },
  );

  const existingLanguages = new Set(
    existingSubtitles.map(({ language }) => language),
  );

  const newEntities: SubtitleEntry[] = [];

  for (const [language, subtitle] of subtitles) {
    if (existingLanguages.has(language)) {
      logger.debug(
        `Subtitle for language "${language}" already exists for ${item.fullTitle}, skipping`,
      );

      continue;
    }

    const entry = em.create(SubtitleEntry, {
      language: subtitle.language,
      content: subtitle.content,
      fileHash: subtitle.fileHash,
      fileSize: subtitle.fileSize,
      sourceProvider: subtitle.sourceProvider,
      sourceId: subtitle.sourceId ?? null,
    });

    newEntities.push(entry);
  }

  const newEntriesCount = item.filesystemEntries.add(newEntities);

  if (newEntriesCount > 0) {
    await em.flush();

    logger.info(
      `Persisted ${newEntriesCount.toString()} subtitle(s) for ${item.fullTitle}`,
    );
  }

  return newEntriesCount;
}
