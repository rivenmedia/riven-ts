import { expect, it } from "vitest";

import { mapItemsToFiles } from "./map-items-to-files.ts";

it("maps movie files correctly", () => {
  const result = mapItemsToFiles([
    { fileName: "The Matrix 1999.mkv", fileSize: 1024 },
    { fileName: "Inception 2010.mkv", fileSize: 2048 },
  ]);

  expect(result).toEqual({
    movies: {
      "0": { fileName: "The Matrix 1999.mkv", fileSize: 1024 },
      "1": { fileName: "Inception 2010.mkv", fileSize: 2048 },
    },
    episodes: {},
  });
});

it("maps episode files correctly", () => {
  const result = mapItemsToFiles([
    { fileName: "Breaking Bad S01E01.mkv", fileSize: 1024 },
    { fileName: "Breaking Bad S01E02.mkv", fileSize: 2048 },
  ]);

  expect(result).toEqual({
    movies: {},
    episodes: {
      "1:1": { fileName: "Breaking Bad S01E01.mkv", fileSize: 1024 },
      "1:2": { fileName: "Breaking Bad S01E02.mkv", fileSize: 2048 },
    },
  });
});

it("handles mixed movie and episode files", () => {
  const result = mapItemsToFiles([
    { fileName: "The Matrix 1999.mkv", fileSize: 1024 },
    { fileName: "Breaking Bad S01E01.mkv", fileSize: 1024 },
    { fileName: "Inception 2010.mkv", fileSize: 2048 },
  ]);

  expect(result).toEqual({
    movies: {
      "0": { fileName: "The Matrix 1999.mkv", fileSize: 1024 },
      "1": { fileName: "Inception 2010.mkv", fileSize: 2048 },
    },
    episodes: {
      "1:1": { fileName: "Breaking Bad S01E01.mkv", fileSize: 1024 },
    },
  });
});

it("skips files that fail to parse", () => {
  const result = mapItemsToFiles([
    { fileName: "The Matrix 1999.mkv", fileSize: 1024 },
    { fileName: '!"£$%^&(', fileSize: 1024 },
    { fileName: "Breaking Bad S01E01.mkv", fileSize: 1024 },
  ]);

  expect(result).toEqual({
    movies: {
      "0": { fileName: "The Matrix 1999.mkv", fileSize: 1024 },
    },
    episodes: {
      "1:1": { fileName: "Breaking Bad S01E01.mkv", fileSize: 1024 },
    },
  });
});

it("handles absolute season numbering", () => {
  const result = mapItemsToFiles([
    { fileName: "Naruto 1025.mkv", fileSize: 1024 },
  ]);

  expect(result).toEqual({
    movies: {},
    episodes: {
      "abs:1025": { fileName: "Naruto 1025.mkv", fileSize: 1024 },
    },
  });
});

it("returns empty result for empty input", () => {
  const result = mapItemsToFiles([]);

  expect(result).toEqual({
    movies: {},
    episodes: {},
  });
});
