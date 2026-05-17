import Fuse from "@zkochan/fuse-native";
import { expect, vi } from "vitest";

import { it } from "../../__tests__/test-context.ts";
import { FuseError } from "../errors/fuse-error.ts";
import { openSync } from "./open.ts";

it("returns FuseError code when open throws FuseError", async ({
  services,
}) => {
  vi.spyOn(services.vfsService, "parsePath").mockImplementation(() => {
    throw new FuseError(Fuse.ENOENT, "Not found");
  });

  const callback = vi.fn();
  const linkRequestQueues = new Map();

  openSync("/nonexistent/path", 0, linkRequestQueues, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(Fuse.ENOENT);
  });
});

it("returns EIO when open throws unexpected error", async ({ services }) => {
  vi.spyOn(services.vfsService, "parsePath").mockImplementation(() => {
    throw new Error("Unexpected");
  });

  const callback = vi.fn();
  const linkRequestQueues = new Map();

  openSync("/broken/path", 0, linkRequestQueues, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(Fuse.EIO);
  });
});

it("opens a subtitle file successfully", async ({ services }) => {
  vi.spyOn(services.vfsService, "parsePath").mockReturnValue({
    pathType: "subtitle-file",
    rawPath: "/shows/Test/Season 01/Test.srt",
    base: "Test.srt",
  } as any);

  vi.spyOn(services.vfsService, "getSubtitleEntry").mockResolvedValue({
    content: "1\n00:00:01,000 --> 00:00:02,000\nHello\n",
  } as any);

  const callback = vi.fn();
  const linkRequestQueues = new Map();

  openSync("/shows/Test/Season 01/Test.srt", 0, linkRequestQueues, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(0, expect.any(Number));
  });
});

it("returns ENOENT when subtitle entry is not found", async ({ services }) => {
  vi.spyOn(services.vfsService, "parsePath").mockReturnValue({
    pathType: "subtitle-file",
    rawPath: "/shows/Test/Season 01/Missing.srt",
    base: "Missing.srt",
  } as any);

  vi.spyOn(services.vfsService, "getSubtitleEntry").mockResolvedValue(
    undefined as any,
  );

  const callback = vi.fn();
  const linkRequestQueues = new Map();

  openSync("/shows/Test/Season 01/Missing.srt", 0, linkRequestQueues, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(Fuse.ENOENT);
  });
});

it("returns ENOENT when media entry is not found", async ({ services }) => {
  vi.spyOn(services.vfsService, "parsePath").mockReturnValue({
    pathType: "single-movie",
    rawPath: "/movies/Test Movie (2024) {tmdb-12345}/movie.mkv",
    base: "movie.mkv",
    tmdbId: "12345",
  } as any);

  vi.spyOn(services.vfsService, "getMediaEntry").mockResolvedValue(
    undefined as any,
  );

  const callback = vi.fn();
  const linkRequestQueues = new Map();

  openSync(
    "/movies/Test Movie (2024) {tmdb-12345}/movie.mkv",
    0,
    linkRequestQueues,
    callback,
  );

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(Fuse.ENOENT);
  });
});
