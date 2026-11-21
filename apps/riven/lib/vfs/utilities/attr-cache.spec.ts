import { expect, it } from "vitest";

import { attrCache } from "./attr-cache.ts";

const cachedPaths = Object.freeze([
  "/",
  "/movies",
  "/movies/Movie (2020) {tmdb-1}",
  "/movies/Movie (2020) {tmdb-1}/Movie (2020) {tmdb-1}.mkv",
  "/movies/Other (2021) {tmdb-2}",
  "/shows",
]);

it.beforeEach(() => {
  attrCache.clear();

  for (const path of cachedPaths) {
    attrCache.set(path, { size: path.length });
  }
});

it("removes the cached attributes of every ancestor directory when an entry is deleted", () => {
  attrCache.delete("/movies/Movie (2020) {tmdb-1}/Movie (2020) {tmdb-1}.mkv");

  expect(new Set(attrCache.keys())).toStrictEqual(
    new Set(["/movies/Other (2021) {tmdb-2}", "/shows"]),
  );
});

it("keeps the other cached entries when the root directory is deleted", () => {
  attrCache.delete("/");

  expect(new Set(attrCache.keys())).toStrictEqual(
    new Set(cachedPaths.filter((path) => path !== "/")),
  );
});

it("keeps ancestor directories cached when an entry's attributes are replaced", () => {
  attrCache.set("/movies/Movie (2020) {tmdb-1}/Movie (2020) {tmdb-1}.mkv", {
    size: 1,
  });

  expect(new Set(attrCache.keys())).toStrictEqual(new Set(cachedPaths));
});
