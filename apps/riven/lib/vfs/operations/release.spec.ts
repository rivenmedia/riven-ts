import Fuse from "@zkochan/fuse-native";
import { expect, vi } from "vitest";

import { it } from "../../__tests__/test-context.ts";
import {
  fdToFileHandleMeta,
  fileNameToFdCountMap,
  fileNameToFileChunkCalculationsMap,
} from "../utilities/file-handle-map.ts";
import { releaseSync } from "./release.ts";

it("releases an unknown fd gracefully", async () => {
  const callback = vi.fn();

  releaseSync("/some/path", 99999, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(0);
  });
});

it("releases a subtitle file handle", async () => {
  const fd = 88888;
  fdToFileHandleMeta.set(fd, {
    type: "subtitle",
    fileSize: 100,
    filePath: "/shows/Test/Season 01/Test.srt",
    fileBaseName: "Test.srt",
    contentBuffer: Buffer.from("test"),
  });

  const callback = vi.fn();

  releaseSync("/shows/Test/Season 01/Test.srt", fd, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(0);
    expect(fdToFileHandleMeta.has(fd)).toBe(false);
  });
});

it("releases a media file handle and decrements fd count", async () => {
  const fd = 77777;
  const fileName = "test-movie.mkv";

  fdToFileHandleMeta.set(fd, {
    type: "media",
    fileSize: 1000000,
    filePath: "/movies/Test/test-movie.mkv",
    fileBaseName: "test-movie.mkv",
    originalFileName: fileName,
    url: "http://example.com/stream",
  });

  fileNameToFdCountMap.set(fileName, 2);

  const callback = vi.fn();

  releaseSync("/movies/Test/test-movie.mkv", fd, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(0);
    expect(fdToFileHandleMeta.has(fd)).toBe(false);
    expect(fileNameToFdCountMap.get(fileName)).toBe(1);
  });
});

it("cleans up file name maps when last fd is released", async () => {
  const fd = 66666;
  const fileName = "last-fd-movie.mkv";

  fdToFileHandleMeta.set(fd, {
    type: "media",
    fileSize: 1000000,
    filePath: "/movies/Test/last-fd-movie.mkv",
    fileBaseName: "last-fd-movie.mkv",
    originalFileName: fileName,
    url: "http://example.com/stream",
  });

  fileNameToFdCountMap.set(fileName, 1);
  fileNameToFileChunkCalculationsMap.set(fileName, {} as any);

  const callback = vi.fn();

  releaseSync("/movies/Test/last-fd-movie.mkv", fd, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(0);
    expect(fileNameToFdCountMap.has(fileName)).toBe(false);
    expect(fileNameToFileChunkCalculationsMap.has(fileName)).toBe(false);
  });
});
