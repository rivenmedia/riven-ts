export const createChunkCacheKey = (
  fileName: string,
  start: number,
  end: number,
) => Buffer.from([fileName, start, end].join("-")).toString("base64");
