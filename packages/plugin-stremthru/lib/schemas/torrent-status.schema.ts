import { type } from "arktype";

/**
 * Possible status values of a Torz torrent
 *
 * @see {@link https://docs.stremthru.13377001.xyz/api/torz#torzstatus}
 */
export const TorrentStatus = type.enumerated(
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
);

export type TorrentStatus = typeof TorrentStatus.infer;
