import { z } from "@rivenmedia/plugin-sdk/validation";

/**
 * Possible status values of a Torz torrent
 *
 * @see {@link https://docs.stremthru.13377001.xyz/api/torz#torzstatus}
 */
export const TorrentStatus = z.enum([
  /**
   * Content is cached on the store
   */
  "cached",

  /**
   * Queued for download
   */
  "queued",

  /**
   * Currently downloading
   */
  "downloading",

  /**
   * Processing after download
   */
  "processing",

  /**
   * Download complete
   */
  "downloaded",

  /**
   * Currently uploading
   */
  "uploading",

  /**
   * Download failed
   */
  "failed",

  /**
   * Invalid Torrent
   */
  "invalid",

  /**
   * Unknown status
   */
  "unknown",
]);

export type TorrentStatus = z.infer<typeof TorrentStatus>;
