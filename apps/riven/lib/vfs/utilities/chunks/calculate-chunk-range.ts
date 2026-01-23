import {
  RequestRange,
  transformRequestRangeToBounds,
} from "../../schemas/request-range.schema.ts";

interface CalculateChunkRangeInput {
  fileId: number;
  requestRange: [start: number, end: number];
  fileSize: number;
  chunkSize: number;
}

export const calculateChunkRange = ({
  chunkSize,
  requestRange: [start, end],
  fileId,
  fileSize,
}: CalculateChunkRangeInput) =>
  RequestRange.pipe(transformRequestRangeToBounds).parse({
    fileId,
    start,
    end,
    fileSize,
    chunkSize,
  });
