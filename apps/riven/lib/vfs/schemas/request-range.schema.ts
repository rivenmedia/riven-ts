import z from "zod";

const isValidRange = ({ end, fileSize, start }: RequestRange) => {
  if (start >= fileSize) {
    return false;
  }

  const effectiveEnd = Math.min(end, fileSize - 1);

  return effectiveEnd >= start;
};

export const transformRequestRangeToBounds = z.transform(
  ({ start, end, fileSize, chunkSize }: RequestRange) => {
    const effectiveEnd = Math.min(end, fileSize - 1);

    const chunkStart = Math.floor(start / chunkSize) * chunkSize;
    const chunkEnd = Math.min(
      Math.ceil((effectiveEnd + 1) / chunkSize) * chunkSize - 1,
      fileSize - 1,
    );

    return {
      cacheKey: `${chunkStart.toString()}-${chunkEnd.toString()}` as const,
      chunkRange: [chunkStart, chunkEnd] as const,
      requestRange: [start, effectiveEnd] as const,
      bytesRequired: effectiveEnd - start + 1,
      size: chunkEnd - chunkStart + 1,
    };
  },
);

export const RequestRange = z
  .object({
    start: z.int().nonnegative(),
    end: z.int().nonnegative(),
    fileSize: z.int().nonnegative(),
    chunkSize: z.int().positive(),
  })
  .refine(isValidRange, "Invalid request range");

export type RequestRange = z.infer<typeof RequestRange>;
