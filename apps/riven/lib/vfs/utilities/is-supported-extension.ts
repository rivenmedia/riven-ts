import path from "node:path";

const supportedExtensions = new Set<`.${string}`>([
  ".mp4",
  ".mkv",
  ".avi",
  ".mov",
  ".wmv",
  ".flv",
  ".webm",
  ".srt",
]);

export const isSupportedExtension = (pathString: string) => {
  const extension = path.extname(pathString);

  if (!extension) {
    return true; // Allow directories to pass through
  }

  return supportedExtensions.has(extension as `.${string}`);
};
