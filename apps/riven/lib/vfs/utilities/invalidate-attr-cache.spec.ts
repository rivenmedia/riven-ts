import { expect, it } from "vitest";

import { attrCache } from "./attr-cache.ts";
import { invalidateAttrCache } from "./invalidate-attr-cache.ts";

const showPath = "/shows/Breaking Bad (2008) {tvdb-81189}";
const seasonPath = `${showPath}/Season 01`;
const episodePath = `${seasonPath}/Breaking Bad (2008) {tvdb-81189} - s01e01.mkv`;
const otherShowPath = "/shows/Death Note (2006) {tvdb-79481}";

it("removes the given path and everything beneath it", () => {
  attrCache.set(showPath, { size: 1 });
  attrCache.set(seasonPath, { size: 1 });
  attrCache.set(episodePath, { size: 1 });

  invalidateAttrCache(["shows/Breaking Bad (2008) {tvdb-81189}"]);

  expect(attrCache.has(showPath)).toBe(false);
  expect(attrCache.has(seasonPath)).toBe(false);
  expect(attrCache.has(episodePath)).toBe(false);
});

it("keeps unrelated paths", () => {
  attrCache.set(otherShowPath, { size: 1 });

  invalidateAttrCache(["shows/Breaking Bad (2008) {tvdb-81189}"]);

  expect(attrCache.has(otherShowPath)).toBe(true);
});
