import { expect, it } from "vitest";

import { mapItemsToFiles } from "./map-items-to-files.ts";

it("maps movie files correctly", () => {
  const result = mapItemsToFiles([
    {
      name: "The Matrix 1999.mkv",
      path: "/The Matrix 1999.mkv",
      size: 1024,
    },
    {
      name: "Inception 2010.mkv",
      path: "/Inception 2010.mkv",
      size: 2048,
    },
  ]);

  expect(result).toEqual({
    movies: {
      "0": {
        name: "The Matrix 1999.mkv",
        path: "/The Matrix 1999.mkv",
        size: 1024,
      },
      "1": {
        name: "Inception 2010.mkv",
        path: "/Inception 2010.mkv",
        size: 2048,
      },
    },
    episodes: {},
  });
});

it("maps episode files correctly", () => {
  const result = mapItemsToFiles([
    {
      name: "Breaking Bad S01E01.mkv",
      path: "/Breaking Bad S01E01.mkv",
      size: 1024,
    },
    {
      name: "Breaking Bad S01E02.mkv",
      path: "/Breaking Bad S01E02.mkv",
      size: 2048,
    },
  ]);

  expect(result).toEqual({
    movies: {},
    episodes: {
      "1:1": {
        name: "Breaking Bad S01E01.mkv",
        path: "/Breaking Bad S01E01.mkv",
        size: 1024,
      },
      "1:2": {
        name: "Breaking Bad S01E02.mkv",
        path: "/Breaking Bad S01E02.mkv",
        size: 2048,
      },
    },
  });
});

it("handles mixed movie and episode files", () => {
  const result = mapItemsToFiles([
    {
      name: "The Matrix 1999.mkv",
      path: "/The Matrix 1999.mkv",
      size: 1024,
    },
    {
      name: "Breaking Bad S01E01.mkv",
      path: "/Breaking Bad S01E01.mkv",
      size: 1024,
    },
    {
      name: "Inception 2010.mkv",
      path: "/Inception 2010.mkv",
      size: 2048,
    },
  ]);

  expect(result).toEqual({
    movies: {
      "0": {
        name: "The Matrix 1999.mkv",
        path: "/The Matrix 1999.mkv",
        size: 1024,
      },
      "1": {
        name: "Inception 2010.mkv",
        path: "/Inception 2010.mkv",
        size: 2048,
      },
    },
    episodes: {
      "1:1": {
        name: "Breaking Bad S01E01.mkv",
        path: "/Breaking Bad S01E01.mkv",
        size: 1024,
      },
    },
  });
});

it("skips files that fail to parse", () => {
  const result = mapItemsToFiles([
    {
      name: "The Matrix 1999.mkv",
      path: "/The Matrix 1999.mkv",
      size: 1024,
    },
    {
      name: '!"£$%^&(',
      path: '/!"£$%^&(',
      size: 1024,
    },
    {
      name: "Breaking Bad S01E01.mkv",
      path: "/Breaking Bad S01E01.mkv",
      size: 1024,
    },
  ]);

  expect(result).toEqual({
    movies: {
      "0": {
        name: "The Matrix 1999.mkv",
        path: "/The Matrix 1999.mkv",
        size: 1024,
      },
    },
    episodes: {
      "1:1": {
        name: "Breaking Bad S01E01.mkv",
        path: "/Breaking Bad S01E01.mkv",
        size: 1024,
      },
    },
  });
});

it("handles absolute season numbering", () => {
  const result = mapItemsToFiles([
    {
      name: "Naruto 1025.mkv",
      path: "/Naruto 1025.mkv",
      size: 1024,
    },
  ]);

  expect(result).toEqual({
    movies: {},
    episodes: {
      "abs:1025": {
        name: "Naruto 1025.mkv",
        path: "/Naruto 1025.mkv",
        size: 1024,
      },
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
