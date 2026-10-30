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
    minimum: 50,
    bitrate: 49,
    reason: "under the configured minimum bitrate of 50",
  },
  {
    label: "over the maximum",
    maximum: 50,
    bitrate: 51,
    reason: "over the configured maximum bitrate of 50",
  },
  {
    label: "below the configured range",
    minimum: 40,
    maximum: 60,
    bitrate: 39,
    reason: "under the configured minimum bitrate of 40",
  },
  {
    label: "above the configured range",
    minimum: 40,
    maximum: 60,
    bitrate: 61,
    reason: "over the configured maximum bitrate of 60",
  },
];

export const acceptedBitrateCases: BitrateCase[] = [
  { label: "exactly at the minimum", minimum: 50, bitrate: 50 },
  { label: "exactly at the maximum", maximum: 50, bitrate: 50 },
  {
    label: "within the configured range",
    minimum: 40,
    maximum: 60,
    bitrate: 50,
  },
  { label: "of any bitrate when no limits are set", bitrate: 1_000_000 },
];

/**
 * Inverse of the average bitrate calculation in the implementation,
 * so that file sizes can be expressed in terms of their resulting bitrate.
 */
export function fileSizeForBitrate(bitrate: number, runtime: number) {
  return bitrate * runtime * 1024 * 1024;
}
