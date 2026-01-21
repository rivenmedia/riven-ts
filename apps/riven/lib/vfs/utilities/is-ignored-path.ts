import path from "node:path";

export const isIgnoredPath = (pathString: string) => {
  const pathInfo = path.parse(pathString);

  return pathInfo.base.toLowerCase() === "folder.jpg";
};
