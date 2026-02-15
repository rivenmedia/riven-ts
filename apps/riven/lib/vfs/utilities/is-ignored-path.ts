import path from "node:path";

const IGNORED_PATHS = new Set(["folder.jpg"]);

export const isIgnoredPath = (pathString: string) => {
  const pathInfo = path.parse(pathString);

  return IGNORED_PATHS.has(pathInfo.base.toLowerCase());
};
