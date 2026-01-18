import path from "node:path";

export const isHiddenPath = (pathString: string) => {
  const pathInfo = path.parse(pathString);

  return pathInfo.base.startsWith(".");
};
