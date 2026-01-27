export const createChunkCacheKey = (
  fileName: string,
  start: number,
  end: number,
) => {
  const rawKey = [fileName, start, end].join(
    "-",
  ) as `${string}-${string}-${string}`;

  return Buffer.from(rawKey).toString("base64");
};
