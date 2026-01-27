import {
  RequestRange,
  transformRequestRangeToBounds,
} from "../../schemas/request-range.schema.ts";

interface CalculateChunkRangeInput {
  requestRange: [start: number, end: number];
  fileSize: number;
  chunkSize: number;
  fileName: string;
}

export const calculateChunkRange = ({
  chunkSize,
  requestRange: [start, end],
  fileSize,
  fileName,
}: CalculateChunkRangeInput) =>
  RequestRange.pipe(transformRequestRangeToBounds).parse({
    start,
    end,
    fileSize,
    chunkSize,
    fileName,
  });
