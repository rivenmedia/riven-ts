import { MediaItemType } from "@repo/util-plugin-sdk/dto/entities/index";

export const config = {
  /**
   * Mapping of child query types based on parent media item type.
   */
  childQueryType: {
    movies: MediaItemType.enum.movie,
    shows: MediaItemType.enum.episode,
  } satisfies Record<string, MediaItemType>,

  /**
   * Root path for the virtual file system.
   */
  rootPath: "/",

  /**
   * Kernel block size; the byte length the OS reads/writes at a time.
   */
  blockSize: 131072, // 128 KB

  /**
   * Default header size for scanning purposes.
   */
  headerSize: 262144, // 256 KB

  /**
   * Minimum footer size for scanning purposes.
   */
  minFooterSize: 16384, // 16 KB

  /**
   * Maximum footer size for scanning purposes.
   */
  maxFooterSize: 10485760, // 10 MB

  /**
   * Target footer size as a percentage of the file size.
   */
  targetFooterPercentage: 0.02, // 2%

  /**
   * Chunk size (in bytes) used for streaming calculations.
   */
  chunkSize: 1048576, // 1 MB

  /**
   * Timeout for detecting stalled streams.
   */
  activityTimeoutSeconds: 60,

  /**
   * Timeout for establishing a connection to the streaming service.
   */
  connectTimeoutSeconds: 10,

  /**
   * Timeout for waiting for a chunk to become available.
   */
  chunkTimeoutSeconds: 10,

  /**
   * Tolerance for detecting scan reads. Any read that jumps more than this value is considered a scan.
   */
  scanToleranceBlocks: 25,

  /**
   * Scan tolerance in bytes.
   */
  get scanToleranceBytes() {
    return this.scanToleranceBlocks * this.blockSize;
  },
} as const;
