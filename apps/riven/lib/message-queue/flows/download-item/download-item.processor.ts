import { Season, Show } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import { MediaItemDownloadError } from "@repo/util-plugin-sdk/schemas/events/media-item.download.error.event";
import { MediaItemDownloadErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.download.incorrect-state.event";

import { UnrecoverableError } from "bullmq";
import chalk from "chalk";
import { DateTime } from "luxon";

import { database } from "../../../database/database.ts";
import { downloadItemProcessorSchema } from "./download-item.schema.ts";

export const downloadItemProcessor = downloadItemProcessorSchema.implementAsync(
  async function ({ job }, { sendEvent, services }) {
    const [finalResult] = Object.values(await job.getChildrenValues());

    const item = await database.mediaItem.findOneOrFail(job.data.id);

    if (!finalResult) {
      sendEvent({
        type: "riven.media-item.download.error",
        item,
        error: new Error("No valid torrent found after trying all downloaders"),
      });

      throw new UnrecoverableError(
        `Failed to download ${chalk.bold(item.fullTitle)}: No valid torrent found after trying all downloaders`,
      );
    }

    try {
      const updatedItem = await services.downloaderService.downloadItem(
        job.data.id,
        finalResult.result,
        finalResult.plugin,
      );

      const incompleteChildStates = MediaItemState.extract([
        "indexed",
        "scraped",
      ]);

      if (updatedItem instanceof Show || updatedItem instanceof Season) {
        const episodes =
          updatedItem instanceof Show
            ? await updatedItem.getEpisodes()
            : await updatedItem.episodes.loadItems();

        const hasIncompleteItems = episodes.some(
          ({ state }) => incompleteChildStates.safeParse(state).success,
        );

        if (hasIncompleteItems) {
          sendEvent({
            type: "riven.media-item.download.partial-success",
            item: updatedItem,
            downloader: finalResult.plugin,
          });

          return;
        }
      }

      sendEvent({
        type: "riven.media-item.download.success",
        item: updatedItem,
        downloader: finalResult.plugin,
        durationFromRequestToDownload: DateTime.utc()
          .diff(DateTime.fromMillis(job.timestamp))
          .as("seconds"),
        provider: finalResult.result.provider,
      });
    } catch (error) {
      if (
        error instanceof MediaItemDownloadError ||
        error instanceof MediaItemDownloadErrorIncorrectState
      ) {
        sendEvent(error.payload);

        throw new UnrecoverableError(
          `Failed to persist download results for ${item.fullTitle}: ${error.message}`,
        );
      }

      throw error;
    }
  },
);
