import {
  BaseDataSource,
  type BasePluginContext,
  type RateLimiterOptions,
} from "@repo/util-plugin-sdk";
import {
  Episode,
  type MediaItem,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";
import { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";
import { TorrentContainer } from "@repo/util-plugin-sdk/schemas/torrents/torrent-container";
import { TorrentFile } from "@repo/util-plugin-sdk/schemas/torrents/torrent-file";
import { TorrentInfo } from "@repo/util-plugin-sdk/schemas/torrents/torrent-info";
import { UnrestrictedLink } from "@repo/util-plugin-sdk/schemas/torrents/unrestricted-link";

import { AddMagnetResponse } from "../schemas/add-magnet-response.schema.ts";
import { RealDebridError } from "../schemas/realdebrid-error.schema.ts";
import { RealDebridTorrentInfo } from "../schemas/torrent-info.schema.ts";

import type { RealDebridSettings } from "../realdebrid-settings.schema.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";
import type {
  DataSourceFetchResult,
  RequestOptions,
  ValueOrPromise,
} from "@apollo/datasource-rest/dist/RESTDataSource.js";

export class RealDebridAPIError extends Error {}

export class RealDebridAPI extends BaseDataSource<RealDebridSettings> {
  override baseURL = "https://api.real-debrid.com/rest/1.0/";
  override serviceName = "RealDebrid";

  protected override rateLimiterOptions?: RateLimiterOptions | undefined = {
    max: 250 / 60,
    duration: 1000,
  };

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ): ValueOrPromise<void> {
    requestOpts.headers["authorization"] = `Bearer ${this.settings.apiKey}`;
  }

  override async throwIfResponseIsError(options: {
    url: URL;
    request: RequestOptions;
    response: DataSourceFetchResult<unknown>["response"];
    parsedBody: unknown;
  }): Promise<void> {
    await super.throwIfResponseIsError(options);

    const realDebridError = RealDebridError.safeParse(options.parsedBody);

    if (realDebridError.success) {
      throw new RealDebridAPIError(
        `${realDebridError.data.error} - ${realDebridError.data.error_details} [code: ${realDebridError.data.error_code.toString()}]`,
      );
    }
  }

  override async validate() {
    try {
      // Implement your own validation logic here
      await this.get("validate");

      return true;
    } catch {
      return false;
    }
  }

  async #addTorrent(infoHash: string) {
    const body = new URLSearchParams({
      magnet: `magnet:?xt=urn:btih:${infoHash}`.toLowerCase(),
    });

    const { id: torrentId } = await this.post<AddMagnetResponse>(
      "torrents/addMagnet",
      {
        body,
      },
    );

    if (!torrentId) {
      throw new RealDebridAPIError("Failed to add torrent to RealDebrid.");
    }

    return torrentId;
  }

  async #selectFiles(torrentId: string, fileIds?: number[]) {
    const body = new URLSearchParams({
      files: fileIds?.join(",") ?? "all",
    });

    await this.post<undefined>(`torrents/selectFiles/${torrentId}`, {
      body,
    });
  }

  async #getTorrentInfo(torrentId: string): Promise<TorrentInfo> {
    const { files, links, status, ...torrentInfo } =
      RealDebridTorrentInfo.parse(await this.get(`torrents/info/${torrentId}`));

    const torrentFiles = new Map<number, TorrentFile>();

    for (const file of files) {
      const { success, data, error } = TorrentFile.safeParse({
        ...file,
        downloadUrl: null,
      });

      if (!success) {
        this.logger.warn(
          `Failed to parse torrent file info for file ID ${file.id.toString()}: ${error.message}`,
        );

        continue;
      }

      torrentFiles.set(file.id, data);
    }

    if (status === "downloaded" && links.length) {
      try {
        const selectedFiles = files.filter(
          (file): file is TorrentFile & { selected: 1 } => file.selected === 1,
        );

        this.logger.debug(
          `Correlating ${selectedFiles.length.toString()} selected files with ${links.length.toString()} links for torrent ${torrentId}`,
        );

        for (let i = 0; i < Math.min(selectedFiles.length, links.length); i++) {
          const selectedFile = selectedFiles[i];
          const torrentLink = links[i];

          if (!selectedFile) {
            this.logger.warn(
              `No selected file found at index ${i.toString()} for torrent ${torrentId}`,
            );

            continue;
          }

          if (!torrentLink) {
            this.logger.warn(
              `No torrent link found at index ${i.toString()} for torrent ${torrentId}`,
            );

            continue;
          }

          const { id: fileId, ...fileData } = selectedFile;
          const torrentFile = torrentFiles.get(fileId);

          if (torrentFile) {
            torrentFile.downloadUrl = torrentLink;

            this.logger.silly(`Added torrent link for file ${fileData.path}`);
          } else {
            this.logger.warn(
              `File key ${fileId.toString()} not found in torrent files map.`,
            );
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          this.logger.warn(
            `Failed to correlate torrent links for torrent ${torrentId}: ${error.message}`,
          );
        }
      }
    }

    return TorrentInfo.parse({
      id: torrentInfo.id,
      name: torrentInfo.filename,
      infoHash: torrentInfo.hash,
      bytes: torrentInfo.bytes,
      createdAt: torrentInfo.added,
      alternativeFilename: torrentInfo.original_filename,
      progress: torrentInfo.progress,
      status,
      files: Object.fromEntries(torrentFiles.entries()),
      links,
    } satisfies Partial<TorrentInfo>);
  }

  async #processTorrent(
    torrentId: string,
    infoHash: string,
  ): Promise<TorrentContainer> {
    const info = await this.#getTorrentInfo(torrentId);

    if (Object.keys(info.files).length === 0) {
      throw new Error("No files found in the torrent.");
    }

    const torrentFiles = [...Object.values(info.files)];
    const { data: status } = RealDebridTorrentInfo.shape.status.safeParse(
      info.status,
    );

    switch (status) {
      case "waiting_files_selection": {
        const videoExtensions = [
          // TODO: Move to settings
          ".mp4",
          ".mkv",
          ".avi",
          ".mov",
          ".wmv",
          ".flv",
          ".webm",
        ];

        const videoIds = torrentFiles
          .filter(({ fileName }) =>
            new RegExp(`(${videoExtensions.join("|")})$`).exec(
              fileName.toLowerCase(),
            ),
          )
          .map(({ id }) => id);

        if (videoIds.length === 0) {
          throw new Error("No video files found in the torrent.");
        }

        await this.#selectFiles(torrentId, videoIds);

        // Re-fetch torrent info after file selection
        return await this.#processTorrent(torrentId, infoHash);
      }
      case "downloaded": {
        const files: DebridFile[] = [];

        let filesizeLimitReached = false;

        for (const file of torrentFiles) {
          if (!file.selected) {
            continue;
          }

          try {
            const debridFile = DebridFile.parse({
              fileId: file.id,
              fileName: file.fileName,
              fileSize: file.bytes,
              downloadUrl: file.downloadUrl,
            });

            if (file.downloadUrl) {
              debridFile.downloadUrl = file.downloadUrl;

              this.logger.debug(
                `Using correlated download URL for file ${file.fileName}`,
              );
            } else {
              this.logger.warn(
                `No download URL found for file ${file.fileName}`,
              );
            }

            files.push(debridFile);
          } catch (error) {
            console.error(error);
          }
        }

        if (!files.length) {
          if (filesizeLimitReached) {
            throw new Error("File size above set limit");
          }

          throw new Error("No valid files found in the torrent.");
        }

        return TorrentContainer.parse({
          infoHash,
          files,
          torrentId,
          torrentInfo: info,
        });
      }
      case "magnet_error":
      case "error":
      case "virus":
      case "dead":
      case "compressing":
      case "uploading":
        throw new Error(`RealDebrid torrent is in an error state: ${status}`);
      default: {
        throw new Error(
          `Unsupported RealDebrid torrent status: ${status ?? "unknown"}`,
        );
      }
    }
  }

  async #deleteTorrent(torrentId: string) {
    return this.delete<undefined>(`torrents/delete/${torrentId}`);
  }

  async getInstantAvailability(item: MediaItem): Promise<TorrentContainer> {
    const loadedStreams = await item.streams.loadItems();
    const infoHash = loadedStreams[0]?.infoHash;

    if (!infoHash) {
      throw new RealDebridAPIError(
        `${item.title} does not have any streams with an info hash.`,
      );
    }

    const itemType =
      (item instanceof Movie ? "movie" : null) ??
      (item instanceof Show ? "show" : null) ??
      (item instanceof Episode ? "episode" : null) ??
      (item instanceof Season ? "season" : null) ??
      null;

    if (!itemType) {
      throw new RealDebridAPIError(
        "Media item type is not supported for RealDebrid processing.",
      );
    }

    const torrentId = await this.#addTorrent(infoHash);

    try {
      return await this.#processTorrent(torrentId, infoHash);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.warn(
          `Failed to process RealDebrid torrent ${torrentId}: ${error.message}. Attempting to delete torrent.`,
        );
      }

      try {
        await this.#deleteTorrent(torrentId);
      } catch (deletionError) {
        this.logger.debug(
          `Failed to delete RealDebrid torrent ${torrentId} after processing error: ${
            deletionError instanceof Error
              ? deletionError.message
              : String(deletionError)
          }`,
        );
      }

      throw new RealDebridAPIError(
        `Failed to process torrent: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async unrestrictLink(link: string) {
    const body = new URLSearchParams({
      link,
    });

    const response = await this.post<UnrestrictedLink>("unrestrict/link", {
      body,
    });

    return UnrestrictedLink.parse(response);
  }
}

export type RealDebridContextSlice = BasePluginContext;
