export interface BitrateCase {
  label: string;
  minimum?: number | undefined;
  maximum?: number | undefined;
  bitrate: number;
}

interface RejectedBitrateCase extends BitrateCase {
  reason: string;
}

export const rejectedBitrateCases: RejectedBitrateCase[] = [
  {
    label: "under the minimum",
    minimum: 10_000,
    bitrate: 9999,
    reason: "under the configured minimum bitrate of 10000",
  },
  {
    label: "over the maximum",
    maximum: 10_000,
    bitrate: 10_001,
    reason: "over the configured maximum bitrate of 10000",
  },
  {
    label: "below the configured range",
    minimum: 5000,
    maximum: 15_000,
    bitrate: 4999,
    reason: "under the configured minimum bitrate of 5000",
  },
  {
    label: "above the configured range",
    minimum: 5000,
    maximum: 15_000,
    bitrate: 15_001,
    reason: "over the configured maximum bitrate of 15000",
  },
];

export const acceptedBitrateCases: BitrateCase[] = [
  { label: "exactly at the minimum", minimum: 10_000, bitrate: 10_000 },
  { label: "exactly at the maximum", maximum: 10_000, bitrate: 10_000 },
  {
    label: "within the configured range",
    minimum: 5000,
    maximum: 15_000,
    bitrate: 10_000,
  },
  { label: "of any bitrate when no limits are set", bitrate: 1_000_000 },
];

/**
 * Inverse of the average bitrate calculation in the implementation,
 * so that file sizes can be expressed in terms of their resulting bitrate.
 *
 * @param bitrate The average bitrate in kbps
 * @param runtime The runtime in minutes
 * @returns The file size in bytes
 */
export function fileSizeForBitrate(bitrate: number, runtime: number) {
  return (bitrate * 1000 * runtime * 60) / 8;
}
