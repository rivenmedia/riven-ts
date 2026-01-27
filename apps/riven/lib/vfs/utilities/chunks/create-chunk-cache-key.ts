export const createChunkCacheKey = (
  fileName: string,
  start: number,
  end: number,
) => {
  return [fileName, start, end].join("-") as `${string}-${string}-${string}`;
};
