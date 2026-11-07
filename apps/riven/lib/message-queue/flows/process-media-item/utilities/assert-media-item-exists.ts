import { NotFoundError } from "@mikro-orm/core";
import { UnrecoverableError } from "bullmq";

import type { MediaItemService } from "#database/services/media-item/media-item.service.ts";
import type { UUID } from "node:crypto";

export async function assertMediaItemExists(
  mediaItemService: MediaItemService,
  id: UUID,
) {
  try {
    await mediaItemService.getMediaItemById(id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new UnrecoverableError(`Media item with ID ${id} not found`);
    }

    throw error;
  }
}
