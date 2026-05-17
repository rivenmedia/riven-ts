import { beforeEach, describe, expect, it } from "vitest";

import { attrCache } from "./attr-cache.ts";

describe("attrCache", () => {
  beforeEach(() => {
    attrCache.clear();
  });

  it("stores and retrieves values", () => {
    attrCache.set("/foo/bar", { size: 100 });

    expect(attrCache.get("/foo/bar")).toEqual({ size: 100 });
  });

  it("returns undefined for missing keys", () => {
    expect(attrCache.get("/nonexistent")).toBeUndefined();
  });

  it("invalidates parent directories on delete of a non-root path", () => {
    attrCache.set("/", { size: 0 });
    attrCache.set("/foo", { size: 10 });
    attrCache.set("/foo/bar", { size: 20 });
    attrCache.set("/foo/bar/baz", { size: 30 });

    // Deleting /foo/bar/baz should invalidate parents /foo/bar, /foo, /
    attrCache.delete("/foo/bar/baz");

    expect(attrCache.has("/foo/bar/baz")).toBe(false);
    expect(attrCache.has("/foo/bar")).toBe(false);
    expect(attrCache.has("/foo")).toBe(false);
    expect(attrCache.has("/")).toBe(false);
  });

  it("does not invalidate parents when deleting root", () => {
    attrCache.set("/", { size: 0 });
    attrCache.set("/foo", { size: 10 });

    attrCache.delete("/");

    // Root itself is deleted, but /foo is unaffected since root has special handling
    expect(attrCache.has("/")).toBe(false);
    expect(attrCache.has("/foo")).toBe(true);
  });

  it("handles single-level paths", () => {
    attrCache.set("/", { size: 0 });
    attrCache.set("/single", { size: 5 });

    attrCache.delete("/single");

    expect(attrCache.has("/single")).toBe(false);
    expect(attrCache.has("/")).toBe(false);
  });
});
